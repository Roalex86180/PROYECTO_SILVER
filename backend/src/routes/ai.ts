import { Router, Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import prisma from '../utils/prisma'
import { trackEvent } from '../utils/trackEvent'

const router = Router()

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
})

// ─── Helper de Reintentos (Exponential Backoff) ──────────────────────────────

async function withRetry<T>(
    fn: () => Promise<T>,
    maxAttempts = 3,
    baseDelayMs = 1000
): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn()
        } catch (err: any) {
            const isOverloaded = err?.error?.type === 'overloaded_error'
                || err?.type === 'overloaded_error'
            const isLast = attempt === maxAttempts

            if (!isOverloaded || isLast) throw err

            const delay = baseDelayMs * 2 ** (attempt - 1) // 1s → 2s → 4s
            console.warn(`[AI] Overloaded, reintento ${attempt}/${maxAttempts} en ${delay}ms`)
            await new Promise(r => setTimeout(r, delay))
        }
    }
    throw new Error('Max retries reached')
}

// ─── Schema context (shared between prompts) ─────────────────────────────────

const DB_SCHEMA = `
Tablas disponibles en PostgreSQL:

1. projects (id, name, location, status, description, client_contact, start_date, end_date, budget, created_at)
   - status puede ser: 'active', 'completed', 'paused', 'archived'
2. contracts (id, worker_id, company_id, project_id, start_date, end_date, payment_type, value, created_at)
3. payments (id, contract_id, concept, amount, date, method, notes, receipt_url, created_at)
   - Son los pagos a workers/companies por trabajo en proyectos
   - Para gastos de un proyecto: payments → contracts → projects
4. workers (id, name, ssn, ein, phone, email, address, state, work_authorization, role, type, company_id, created_at)
   - Internos de Silver Star: company_id IS NULL
   - Externos (otras compañías): company_id IS NOT NULL
5. companies (id, name, ein, contact_person, phone, email, address, state, notes, created_at)
6. expenses (id, description, amount, date, category, payment_method, notes, receipt_url, project_id, company_id, created_at)
   - Gastos OPERATIVOS de Silver Star (viajes, comidas, combustible, etc.)
   - NO son pagos a workers/companies
   - Usar SOLO para gastos administrativos de Silver Star
7. routes (id, name, project_id, created_at)
8. locals (id, name, budget, location, address, zip_code, route_id, created_at)
9. route_companies (route_id, company_id)
10. route_workers (route_id, worker_id)
11. local_workers (local_id, worker_id)
12. local_companies (local_id, company_id)
`

// ─── Step 0: Intent Resolver ──────────────────────────────────────────────────

const INTENT_PROMPT = `Eres un analizador de intenciones para un asistente de datos empresariales.

Tu trabajo es analizar la pregunta del usuario (considerando el historial de conversación) 
y determinar:
1. Si es relevante para los datos de la empresa
2. Reformular la pregunta de forma clara y específica para que sea consultable en SQL

${DB_SCHEMA}

REGLAS:
- Si la pregunta es vaga o de seguimiento ("¿por qué?", "¿y en cheque?", "¿cuáles son?"),
  expándela usando el contexto del historial para hacerla específica y consultable
- Si la pregunta requiere comparación, incluye explícitamente qué comparar
- Si la pregunta es sobre análisis ("¿por qué fue poco rentable?"), 
  tradúcela a "obtener datos comparativos de todos los proyectos similares para analizar"
- Si no es relevante para los datos de la empresa, márcala como no relevante
- Para contar elementos relacionados (rutas, locales, workers) SIEMPRE usa 
  COUNT(DISTINCT campo) para evitar duplicados por JOINs múltiples
- Cuando la pregunta pida múltiples conteos en una sola query, usa subconsultas 
  separadas en lugar de JOINs que puedan inflar los resultados

Responde SOLO con JSON:
{
  "isRelevant": true,
  "expandedQuestion": "pregunta reformulada específica y consultable (solo si isRelevant es true)",
  "notRelevantMessage": "mensaje amigable (solo si isRelevant es false)"
}`

// ─── Step 1: SQL Generator ────────────────────────────────────────────────────

const SQL_PROMPT = `Eres un generador de SQL para PostgreSQL.

${DB_SCHEMA}

REGLAS SQL:
- El año actual es 2026. Las fechas de 2026 son válidas y deben consultarse normalmente.
- SOLO genera SELECT, nunca INSERT/UPDATE/DELETE/DROP
- La query SIEMPRE empieza con SELECT sin nada antes
- NUNCA uses comentarios SQL (--)
- Para nombres SIEMPRE usa ILIKE con %: WHERE p.name ILIKE '%texto%'
- Para COUNT: CAST(COUNT(*) AS INTEGER)
- Para COUNT sin duplicados por JOINs: COUNT(DISTINCT alias.id)
- Para montos: ROUND(valor::numeric, 2)

FECHAS — reglas estrictas:
- SIEMPRE castea las columnas de fecha a ::timestamp antes de operar sobre ellas
- Para duración entre fechas:
  EXTRACT(EPOCH FROM (COALESCE(p.end_date, NOW())::timestamp - p.start_date::timestamp))/86400 AS dias
- Para filtrar por año: EXTRACT(YEAR FROM columna::timestamp) = 2024
- Para filtrar por mes: EXTRACT(MONTH FROM columna::timestamp) = 6
- Para fechas relativas: NOW() - INTERVAL 'X months' o 'X days' o 'X years'
- Para fechas que pueden ser NULL: COALESCE(columna, NOW())::timestamp
- NUNCA uses EXTRACT sobre un valor integer o sin ::timestamp explícito

RENTABILIDAD DE PROYECTOS — usa siempre esta estructura:
  SELECT p.id, p.name, p.budget,
    ROUND((p.budget - COALESCE(SUM(pay.amount), 0))::numeric, 2) AS rentabilidad
  FROM projects p
  LEFT JOIN contracts c ON c.project_id = p.id
  LEFT JOIN payments pay ON pay.contract_id = c.id
  GROUP BY p.id, p.name, p.budget

CONTEOS CON MÚLTIPLES JOINS:
- Cuando la pregunta pida contar rutas Y locales en la misma query, usa subconsultas:
  SELECT 
    (SELECT COUNT(*) FROM routes r WHERE r.project_id = p.id) AS total_rutas,
    (SELECT COUNT(*) FROM locals l JOIN routes r ON l.route_id = r.id WHERE r.project_id = p.id) AS total_locales
  FROM projects p WHERE p.name ILIKE '%nombre%'
- NUNCA cuentes con JOINs directos cuando hay múltiples niveles — inflan los resultados

ALIASES OBLIGATORIOS — usa SIEMPRE estos y solo estos:
- projects → p
- contracts → c
- payments → pay
- workers → w
- companies → co
- expenses → e
- routes → r
- locals → l
- route_companies → rc
- route_workers → rw
- local_workers → lw
- local_companies → lc

NUNCA uses un alias que no hayas definido en el FROM o en un JOIN.
Antes de escribir el WHERE, verifica que cada alias referenciado esté declarado.

Responde SOLO con JSON:
{
  "sql": "SELECT ..."
}`

// ─── Step 2: Interpreter ──────────────────────────────────────────────────────

const INTERPRETER_PROMPT = `Eres un intérprete de resultados de base de datos para Silver Star Logistics.

El año actual es 2026. Los datos de la empresa pueden incluir registros de 2026 —
NUNCA asumas que 2026 está en el futuro ni sugieras que una fecha es incorrecta.

Responde de forma clara, amigable y concisa.
- Detecta el idioma de la pregunta original y responde en ese idioma
- NUNCA incluyas SQL en tu respuesta
- USA tabla markdown SOLO si el usuario lo pidió explícitamente ("tabla", "tablita", "en tabla")
- Para números simples responde directo
- Para listas usa texto plano
- Si el resultado está vacío, di "No hay datos registrados" y ofrece alternativas
- NUNCA inventes datos que no estén en el resultado
- NUNCA asumas que una fecha es incorrecta o está en el futuro`

// ─── Route ────────────────────────────────────────────────────────────────────

router.post('/query', async (req: Request, res: Response) => {
    const startTime = Date.now()

    try {
        const { question, history = [] } = req.body

        if (!question?.trim()) {
            res.status(400).json({ error: 'La pregunta es requerida' })
            return
        }

        // ── INTENT ──────────────────────────────────────────────────────────
        const intentResponse = await withRetry(() => client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 512,
            system: INTENT_PROMPT,
            messages: [
                ...history.slice(-6),
                {
                    role: 'user',
                    content: `Pregunta actual del usuario: "${question}"`
                }
            ]
        }))

        const intentRaw = intentResponse.content[0].type === 'text' ? intentResponse.content[0].text : ''
        let intent: { isRelevant: boolean; expandedQuestion?: string; notRelevantMessage?: string }

        try {
            intent = JSON.parse(intentRaw.replace(/```json|```/g, '').trim())
        } catch {
            res.status(500).json({ error: 'Error analizando la pregunta' })
            return
        }

        if (!intent.isRelevant) {
            res.json({
                answer: intent.notRelevantMessage || 'Solo puedo responder sobre datos de Silver Star.',
                sql: null,
                data: null
            })
            return
        }

        const expandedQuestion = intent.expandedQuestion || question

        // ── SQL ──────────────────────────────────────────────────────────────
        const sqlResponse = await withRetry(() => client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            system: SQL_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: `Genera el SQL para responder esta pregunta: "${expandedQuestion}"`
                }
            ]
        }))

        const sqlRaw = sqlResponse.content[0].type === 'text' ? sqlResponse.content[0].text : ''
        let sqlParsed: { sql: string }

        try {
            sqlParsed = JSON.parse(sqlRaw.replace(/```json|```/g, '').trim())
        } catch {
            res.status(500).json({ error: 'Error generando la consulta SQL' })
            return
        }

        const sql = sqlParsed.sql?.trim() ?? ''
        if (!sql.toLowerCase().startsWith('select')) {
            res.status(400).json({ error: 'Solo se permiten consultas SELECT' })
            return
        }

        let queryResult: any[]
        try {
            queryResult = await prisma.$queryRawUnsafe(sql)
            queryResult = JSON.parse(
                JSON.stringify(queryResult, (_, value) =>
                    typeof value === 'bigint' ? Number(value) : value
                )
            )
            console.log('[SQL]:', sql)
            console.log('[RESULT]:', JSON.stringify(queryResult))
        } catch (dbError: any) {
            trackEvent('ai.query.failed', {
                error_type: 'db_query_error',
                error_message: dbError.message?.slice(0, 200),
                prompt_length: question?.length ?? 0,
                duration_ms: Date.now() - startTime,
            })
            res.status(500).json({ error: `Error ejecutando la consulta: ${dbError.message}` })
            return
        }

        // ── INTERPRET ────────────────────────────────────────────────────────
        const interpretResponse = await withRetry(() => client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: INTERPRETER_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: `Pregunta original: "${question}"\nResultado:\n${JSON.stringify(queryResult, null, 2)}`
                }
            ]
        }))

        let answer = interpretResponse.content[0].type === 'text' ? interpretResponse.content[0].text : 'Error de interpretación.'
        answer = answer.replace(/```sql[\s\S]*?```/gi, '').trim()
        answer = answer.replace(/```[\s\S]*?```/gi, '').trim()

        // ── TRACK éxito ──────────────────────────────────────────────────────
        const totalTokensIn =
            intentResponse.usage.input_tokens +
            sqlResponse.usage.input_tokens +
            interpretResponse.usage.input_tokens

        const totalTokensOut =
            intentResponse.usage.output_tokens +
            sqlResponse.usage.output_tokens +
            interpretResponse.usage.output_tokens

        trackEvent('ai.query.success', {
            model: 'haiku+sonnet',
            tokens_in: totalTokensIn,
            tokens_out: totalTokensOut,
            cost_usd: (totalTokensIn * 0.000003) + (totalTokensOut * 0.000015),
            duration_ms: Date.now() - startTime,
        })

        res.json({ answer, sql, data: queryResult })

    } catch (error: any) {
        trackEvent('ai.query.failed', {
            error_type: error.type ?? 'unknown',
            error_message: error.message?.slice(0, 200),
            prompt_length: req.body?.question?.length ?? 0,
            duration_ms: Date.now() - startTime,
        })

        console.error('AI query error:', error)
        res.status(500).json({ error: 'Error procesando tu pregunta' })
    }
})

export default router