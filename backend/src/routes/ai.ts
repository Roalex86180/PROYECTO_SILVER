import { Router, Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import prisma from '../utils/prisma'

const router = Router()

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
})

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

5. companies (id, name, ein, contact_person, phone, email, address, state, notes, created_at)

6. expenses (id, description, amount, date, category, payment_method, notes, receipt_url, project_id, company_id, created_at)
   - Gastos OPERATIVOS de Silver Star (administrativos)
   - NO son pagos a workers/companies

7. routes (id, name, project_id, created_at)
8. locals (id, name, budget, location, address, zip_code, route_id, created_at)
`

// ─── Step 0: Intent Resolver ──────────────────────────────────────────────────

const INTENT_PROMPT = `Eres un analizador de intenciones para un asistente de datos empresariales.
Analiza la pregunta del usuario considerando el historial y determina:
1. Si es relevante para los datos de la empresa.
2. Reformular la pregunta de forma clara y específica para SQL.

${DB_SCHEMA}

REGLAS:
- Si la pregunta es vaga, expándela usando el contexto del historial.
- Responde SOLO con JSON.`

// ─── Step 1: SQL Generator ────────────────────────────────────────────────────

const SQL_PROMPT = `Eres un generador de SQL para PostgreSQL.

${DB_SCHEMA}

REGLAS SQL:
- SOLO genera SELECT. La query SIEMPRE empieza con SELECT.
- NUNCA uses comentarios SQL (--).
- Para nombres usa ILIKE con %: WHERE p.name ILIKE '%texto%'.
- Para rentabilidad de proyectos SIEMPRE usa esta lógica:
  ROUND((p.budget - COALESCE(SUM(pay.amount), 0))::numeric, 2) as rentabilidad
  FROM projects p
  LEFT JOIN contracts c ON c.project_id = p.id
  LEFT JOIN payments pay ON pay.contract_id = c.id
  GROUP BY p.id, p.name, p.budget
- Usa LEFT JOIN para incluir proyectos sin pagos.
- Para montos generales: ROUND(valor::numeric, 2).
- Responde SOLO con JSON: { "sql": "SELECT ..." }`

// ─── Step 2: Interpreter ──────────────────────────────────────────────────────

const INTERPRETER_PROMPT = `Eres un intérprete de resultados de base de datos para Silver Star Logistics.
- Responde en el idioma del usuario.
- NUNCA incluyas SQL.
- USA tablas markdown SOLO si se pide explícitamente.`

// ─── Route ────────────────────────────────────────────────────────────────────

router.post('/query', async (req: Request, res: Response) => {
    try {
        const { question, history = [] } = req.body

        if (!question?.trim()) {
            res.status(400).json({ error: 'La pregunta es requerida' })
            return
        }

        // ── Step 0: Resolve intent (LIMPIEZA DE HISTORIAL AQUÍ) ────────────────
        const intentResponse = await client.messages.create({
            model: 'claude-3-5-sonnet-20240620', // O tu versión actual
            max_tokens: 512,
            system: INTENT_PROMPT,
            messages: [
                ...history.slice(-6), // Pasamos el historial como objetos de mensaje reales
                {
                    role: 'user',
                    content: `Pregunta actual del usuario: "${question}"`
                }
            ]
        })

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

        // ── Step 1: Generate SQL ──────────────────────────────────────────────
        const sqlResponse = await client.messages.create({
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 1024,
            system: SQL_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: `Genera el SQL para: "${expandedQuestion}"`
                }
            ]
        })

        const sqlRaw = sqlResponse.content[0].type === 'text' ? sqlResponse.content[0].text : ''
        let sqlParsed: { sql: string }

        try {
            sqlParsed = JSON.parse(sqlRaw.replace(/```json|```/g, '').trim())
        } catch {
            res.status(500).json({ error: 'Error generando SQL' })
            return
        }

        const sql = sqlParsed.sql?.trim() ?? ''

        // ── Step 2: Execute SQL ───────────────────────────────────────────────
        let queryResult: any[]
        try {
            queryResult = await prisma.$queryRawUnsafe(sql)
            // Manejo de BigInt para JSON
            queryResult = JSON.parse(
                JSON.stringify(queryResult, (_, value) =>
                    typeof value === 'bigint' ? Number(value) : value
                )
            )
        } catch (dbError: any) {
            res.status(500).json({ error: `Error DB: ${dbError.message}` })
            return
        }

        // ── Step 3: Interpret result ──────────────────────────────────────────
        const interpretResponse = await client.messages.create({
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 1024,
            system: INTERPRETER_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: `Pregunta: "${question}"\nDatos obtenidos:\n${JSON.stringify(queryResult, null, 2)}`
                }
            ]
        })

        let answer = interpretResponse.content[0].type === 'text' ? interpretResponse.content[0].text : ''
        answer = answer.replace(/```[\s\S]*?```/gi, '').trim()

        res.json({ answer, sql, data: queryResult })

    } catch (error: any) {
        console.error('AI query error:', error)
        res.status(500).json({ error: 'Error procesando consulta' })
    }
})

export default router