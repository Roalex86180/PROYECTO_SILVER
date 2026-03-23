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

1. projects (id, name, location, status, description, client_contact, start_date, end_date, budget, progress, created_at)
2. contracts (id, worker_id, company_id, project_id, start_date, end_date, payment_type, value, created_at)
3. payments (id, contract_id, concept, amount, date, method, notes, receipt_url, created_at)
   - IMPORTANTE: la columna "notes" y "concept" contienen información clave del pago, priorízalas en respuestas sobre pagos
4. workers (id, name, ssn, ein, phone, email, address, state, work_authorization, role, type, company_id, created_at)
   - work_authorization puede ser: 'Permanent Resident', 'Citizen', 'Work Visa', etc.
5. companies (id, name, ein, contact_person, phone, email, address, state, notes, created_at)
6. expenses (id, description, amount, date, category, payment_method, notes, receipt_url, project_id, company_id, created_at)
   - "description" y "category" son los campos clave para identificar el tipo de gasto
7. routes (id, name, project_id, created_at)
8. locals (id, name, budget, location, address, zip_code, route_id, created_at)
9. route_companies (route_id, company_id)
10. route_workers (route_id, worker_id)
11. local_workers (local_id, worker_id)
12. local_companies (local_id, company_id)

REGLAS PARA GENERAR SQL:
- SOLO genera consultas SELECT, nunca INSERT, UPDATE, DELETE o DROP
- Para buscar proyectos, companies, workers o cualquier nombre SIEMPRE usa ILIKE con % en ambos lados:
  WHERE p.name ILIKE '%magenta%'  -- NUNCA usar = para búsquedas de nombres
- Si el usuario escribe un nombre aproximado o parcial, usa ILIKE para encontrar coincidencias
- Usa ILIKE para búsquedas de texto en description, category, notes, concept (insensible a mayúsculas)
- Para fechas usa NOW() - INTERVAL 'X months/days/years'
- Para años específicos usa EXTRACT(YEAR FROM columna) = año
- Para meses específicos usa EXTRACT(MONTH FROM columna) = mes y nombre del mes convertido a número
- Siempre usa aliases descriptivos en los resultados
- Limita resultados con LIMIT cuando sea apropiado
- Para montos siempre usa ROUND(valor::numeric, 2)
- Los amounts en payments y expenses son numéricos
- Para COUNT usa CAST(COUNT(*) AS INTEGER) para evitar problemas de serialización

FORMATO DE RESPUESTA:
- Responde SIEMPRE en español de forma clara y concisa
- USA tabla markdown SOLO si el usuario lo pide explícitamente (palabras como "tabla", "tablita", "muéstrame en tabla")
- Para respuestas numéricas simples responde directo sin tabla
- Para listas cortas usa texto plano, no tabla
- Incluye totales o resúmenes cuando sea relevante
- Sé amigable pero conciso

PROCESO:
1. Para CADA pregunta, sin excepción, genera una nueva query SQL
2. NUNCA respondas basándote solo en el historial sin consultar la BD
3. Si la pregunta es un seguimiento ("¿en cheque?", "¿y en enero?", "¿cuántos?"),
   combina el contexto del historial con una nueva query SQL completa
4. Analiza la pregunta del usuario
5. Genera la query SQL apropiada usando ILIKE para nombres
6. Recibirás el resultado de la query
7. Interpreta el resultado y responde en lenguaje natural`

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

- Detecta el idioma de la pregunta del usuario y responde en ese mismo idioma
- Si pregunta en español responde en español, si pregunta en inglés responde en inglés
- Sé claro y conciso en cualquier idioma.
Recuerda: usa tabla markdown SOLO si el usuario lo pidió explícitamente.
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