import { Router, Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import prisma from '../utils/prisma'

const router = Router()

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
})

const SYSTEM_PROMPT = `Eres un asistente de análisis de datos para Silver Star Logistics.

TU ÚNICO ROL es responder preguntas sobre los datos de la empresa usando SQL.
Si el usuario pregunta algo NO relacionado con los datos de la empresa, responde EXACTAMENTE:
"Solo puedo responder preguntas relacionadas con los datos de Silver Star Logistics, como proyectos, pagos, trabajadores, gastos y contratos."

NUNCA respondas preguntas de historia, cultura general, tecnología, u otros temas fuera del negocio.

Tienes acceso a estas tablas de PostgreSQL:

1. projects (id, name, location, status, description, client_contact, start_date, end_date, budget, created_at)

2. contracts (id, worker_id, company_id, project_id, start_date, end_date, payment_type, value, created_at)

3. payments (id, contract_id, concept, amount, date, method, notes, receipt_url, created_at)
   - "notes" y "concept" contienen información clave del pago, priorízalas en respuestas
   - Estos son los pagos registrados a workers y companies por trabajos en proyectos
   - Para saber cuánto se gastó EN un proyecto usa: payments → contracts → projects

4. workers (id, name, ssn, ein, phone, email, address, state, work_authorization, role, type, company_id, created_at)
   - work_authorization puede ser: 'Permanent Resident', 'Citizen', 'Work Visa', etc.
   - Workers internos de Silver Star tienen company_id = NULL
   - Workers externos pertenecen a otras compañías y tienen company_id con valor
   - Para distinguir internos: WHERE w.company_id IS NULL
   - Para distinguir externos: WHERE w.company_id IS NOT NULL

5. companies (id, name, ein, contact_person, phone, email, address, state, notes, created_at)

6. expenses (id, description, amount, date, category, payment_method, notes, receipt_url, project_id, company_id, created_at)
   - Son gastos OPERATIVOS de Silver Star (viajes, comidas, combustible, etc.)
   - NO son pagos a workers o companies por trabajo en proyectos
   - Usa esta tabla SOLO cuando pregunten sobre gastos administrativos de Silver Star
   - Si preguntan "cuánto se gastó en el proyecto X" usa payments → contracts → projects, NO expenses

7. routes (id, name, project_id, created_at)
   - Un proyecto puede no tener rutas asignadas

8. locals (id, name, budget, location, address, zip_code, route_id, created_at)
   - Una ruta puede no tener locales asignados

9. route_companies (route_id, company_id)
10. route_workers (route_id, worker_id)
11. local_workers (local_id, worker_id)
12. local_companies (local_id, company_id)

REGLAS PARA GENERAR SQL:
- SOLO genera consultas SELECT, nunca INSERT, UPDATE, DELETE o DROP
- La query SIEMPRE debe empezar exactamente con la palabra SELECT sin nada antes
- NUNCA uses comentarios SQL (--) al inicio ni en medio del query
- Para nombres SIEMPRE usa ILIKE con % en ambos lados: WHERE p.name ILIKE '%texto%'
- NUNCA uses = para comparar nombres, siempre ILIKE
- Usa ILIKE para description, category, notes, concept
- Para fechas usa NOW() - INTERVAL 'X months/days/years'
- Para años específicos: EXTRACT(YEAR FROM columna) = año
- Para meses específicos: EXTRACT(MONTH FROM columna) = número_mes
- Siempre usa aliases descriptivos
- Para COUNT usa CAST(COUNT(*) AS INTEGER)
- Para montos usa ROUND(valor::numeric, 2)
- Si necesitas múltiples consultas combínalas con UNION o subconsultas
- Si no hay rutas/locales en un proyecto, devuelve los datos disponibles del proyecto

FORMATO DE RESPUESTA:
- Detecta el idioma de la pregunta y responde en ese mismo idioma
- NUNCA incluyas el SQL en tu respuesta, solo el resultado interpretado
- USA tabla markdown SOLO si el usuario lo pide explícitamente ("tabla", "tablita", "en tabla")
- Para números simples responde directo sin tabla
- Para listas cortas usa texto plano
- Incluye totales cuando sea relevante
- Sé amigable pero conciso

PROCESO:
1. Para CADA pregunta genera una nueva query SQL sin excepción
2. NUNCA respondas basándote solo en el historial sin consultar la BD
3. Para preguntas de seguimiento ("¿en cheque?", "¿y en enero?", "¿cuáles son?"),
   combina el contexto del historial con una nueva query SQL completa
4. Cuando el usuario pide "detalle" o "cuáles son" después de una respuesta sobre pagos,
   busca en payments → contracts → projects, NO en expenses
5. Analiza la pregunta, genera SQL, recibe resultado, responde en lenguaje natural

REGLA CRÍTICA ANTI-ALUCINACIÓN:
- Si la query devuelve 0 resultados di exactamente: "No hay datos registrados para esta consulta"
- NUNCA inventes, estimes o supongas datos
- NUNCA uses datos de consultas anteriores como si fueran resultados nuevos
- Si el resultado es vacío, ofrece verificar con otro criterio`

// POST /api/ai/query
router.post('/query', async (req: Request, res: Response) => {
    try {
        const { question, history = [] } = req.body

        if (!question?.trim()) {
            res.status(400).json({ error: 'La pregunta es requerida' })
            return
        }

        // Step 1: Ask Claude to generate SQL
        const sqlResponse = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages: [
                ...history,
                {
                    role: 'user',
                    content: `Pregunta del usuario: "${question}"
          
Responde SOLO con un objeto JSON con este formato exacto (sin markdown, sin explicaciones):
{
  "isRelevant": true/false,
  "sql": "SELECT ... (solo si isRelevant es true)",
  "notRelevantMessage": "mensaje (solo si isRelevant es false)"
}`
                }
            ]
        })

        const rawContent = sqlResponse.content[0].type === 'text' ? sqlResponse.content[0].text : ''

        // Parse JSON response
        let parsed: { isRelevant: boolean; sql?: string; notRelevantMessage?: string }
        try {
            const cleaned = rawContent.replace(/```json|```/g, '').trim()
            parsed = JSON.parse(cleaned)
        } catch {
            res.status(500).json({ error: 'Error procesando la respuesta del modelo' })
            return
        }

        // If not relevant return the not relevant message
        if (!parsed.isRelevant) {
            res.json({
                answer: parsed.notRelevantMessage || 'Solo puedo responder preguntas relacionadas con los datos de Silver Star Logistics.',
                sql: null,
                data: null
            })
            return
        }

        // Validate SQL is only SELECT
        const sql = parsed.sql?.trim() ?? ''
        if (!sql.toLowerCase().startsWith('select')) {
            res.status(400).json({ error: 'Solo se permiten consultas SELECT' })
            return
        }

        // Execute SQL
        let queryResult: any[]
        try {
            queryResult = await prisma.$queryRawUnsafe(sql)

            // Convert BigInt to Number for JSON serialization
            queryResult = JSON.parse(
                JSON.stringify(queryResult, (_, value) =>
                    typeof value === 'bigint' ? Number(value) : value
                )
            )
        } catch (dbError: any) {
            res.status(500).json({ error: `Error ejecutando la consulta: ${dbError.message}` })
            return
        }

        // Ask Claude to interpret the result
        const interpretResponse = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages: [
                ...history,
                { role: 'user', content: question },
                {
                    role: 'user',
                    content: `El resultado de la consulta SQL fue:
${JSON.stringify(queryResult, null, 2)}

Responde la pregunta en el idioma del usuario.
NUNCA incluyas el SQL en tu respuesta.
Usa tabla markdown SOLO si el usuario lo pidió explícitamente.
Para números simples responde directo. Para listas usa texto plano.`
                }
            ]
        })

        const answer = interpretResponse.content[0].type === 'text'
            ? interpretResponse.content[0].text
            : 'No pude interpretar la respuesta.'

        res.json({ answer, sql, data: queryResult })

    } catch (error: any) {
        console.error('AI query error:', error)
        res.status(500).json({ error: 'Error procesando tu pregunta' })
    }
})

export default router