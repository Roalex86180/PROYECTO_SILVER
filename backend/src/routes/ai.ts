import { Router, Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import prisma from '../utils/prisma'

const router = Router()

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
})

/*
MODELOS USADOS

Haiku:
- intent resolver
- interpreter

Sonnet:
- SQL generator
*/

const FAST_MODEL = 'claude-sonnet-4-20250514'
const STRONG_MODEL = 'claude-sonnet-4-20250514'


/*
SCHEMA COMPLETO (solo SQL generator)
*/

const DB_SCHEMA = `
Tablas disponibles en PostgreSQL:

projects (id, name, location, status, description, client_contact, start_date, end_date, budget, created_at)

contracts (id, worker_id, company_id, project_id, start_date, end_date, payment_type, value, created_at)

payments (id, contract_id, concept, amount, date, method, notes, receipt_url, created_at)
- Son pagos a workers/companies por trabajo en proyectos
- Para gastos de proyectos usar:
payments → contracts → projects

workers (id, name, role, company_id)
- Internos: company_id IS NULL
- Externos: company_id IS NOT NULL

companies (id, name)

expenses (id, description, amount, date, category, payment_method, project_id)
- SOLO gastos administrativos Silver Star
- NUNCA usar para rentabilidad de proyectos

routes (id, name, project_id)

locals (id, name, budget, route_id)
`


/*
SCHEMA REDUCIDO (intent resolver)
reduce tokens y latencia
*/

const INTENT_SCHEMA = `
Tablas principales:
projects
payments
contracts
workers
companies
expenses
`


/*
INTENT PROMPT
*/

const INTENT_PROMPT = `
Eres un analizador de intención para consultas SQL empresariales.

${INTENT_SCHEMA}

Tu tarea:

1 detectar si la pregunta es relevante
2 expandir preguntas ambiguas
3 convertir follow-ups en preguntas completas SQL-ready

Ejemplos:

"¿y en enero?"
→ expandir usando contexto previo

"¿por qué fue menos rentable?"
→ comparar con proyectos similares

Si menciona:

comparado con otros
en relación a los demás
respecto a otros proyectos

expandir incluyendo:

comparar contra proyectos del mismo estado

Responde SOLO JSON:

{
"isRelevant": true/false,
"expandedQuestion": "...",
"notRelevantMessage": "..."
}
`


/*
SQL GENERATOR PROMPT
*/

const SQL_PROMPT = `
Eres un generador experto SQL PostgreSQL.

${DB_SCHEMA}

REGLAS CRÍTICAS:

Para calcular rentabilidad:

rentabilidad = projects.budget - SUM(payments.amount)

NUNCA usar expenses para rentabilidad

Usar SOLO:

payments → contracts → projects

REGLAS SQL:

SOLO SELECT o WITH SELECT

Nunca INSERT UPDATE DELETE DROP

Para nombres:

ILIKE '%texto%'

Para fechas:

NOW() - INTERVAL 'X months'

Para COUNT:

CAST(COUNT(*) AS INTEGER)

Para montos:

ROUND(valor::numeric, 2)

Responder SOLO JSON:

{
"sql": "SELECT ..."
}
`


/*
INTERPRETER PROMPT
*/

const INTERPRETER_PROMPT = `
Eres un intérprete de resultados SQL.

Responde claro, corto y natural.

Si resultado vacío:

"No hay datos registrados para esta consulta"

Nunca inventar datos
Nunca incluir SQL
`


/*
Detectar si pregunta es simple
(bypass intent resolver)
*/

function isSimpleQuery(question: string) {
    const q = question.toLowerCase()

    return (
        question.length < 40 &&
        !q.includes('compar') &&
        !q.includes('relación') &&
        !q.includes('respecto') &&
        !q.includes('por qué')
    )
}


/*
VALIDADOR SQL
permite SELECT y WITH SELECT
*/

function validateSQL(sql: string) {

    if (!/^(select|with)\s/i.test(sql)) {
        throw new Error('Solo se permiten consultas SELECT')
    }

}


/*
PARSE JSON Claude seguro
*/

function parseClaudeJSON(raw: string) {

    try {
        return JSON.parse(
            raw.replace(/```json|```/g, '').trim()
        )
    } catch {

        throw new Error('Error parseando JSON Claude')

    }

}


/*
ROUTE PRINCIPAL
*/

router.post('/query', async (req: Request, res: Response) => {

    try {

        const { question, history = [] } = req.body

        if (!question?.trim()) {

            res.status(400).json({
                error: 'Pregunta requerida'
            })

            return
        }


        /*
        STEP 0
        intent resolver (solo si necesario)
        */

        let expandedQuestion = question

        if (!isSimpleQuery(question) && history.length > 0) {

            const intentResponse = await client.messages.create({

                model: FAST_MODEL,

                max_tokens: 300,

                system: INTENT_PROMPT,

                messages: [

                    ...history.slice(-6),

                    {
                        role: 'user',
                        content: question
                    }

                ]

            })


            const rawIntent = intentResponse.content[0].type === 'text'
                ? intentResponse.content[0].text
                : ''


            const parsedIntent = parseClaudeJSON(rawIntent)


            if (!parsedIntent.isRelevant) {

                res.json({

                    answer: parsedIntent.notRelevantMessage ||
                        'Solo puedo responder preguntas sobre Silver Star Logistics',

                    sql: null,

                    data: null

                })

                return

            }


            expandedQuestion = parsedIntent.expandedQuestion || question

        }


        console.log('Expanded question:', expandedQuestion)


        /*
        STEP 1
        generar SQL
        */

        const sqlResponse = await client.messages.create({

            model: STRONG_MODEL,

            max_tokens: 700,

            system: SQL_PROMPT,

            messages: [

                {
                    role: 'user',
                    content:
                        `Genera SQL para:

${expandedQuestion}`
                }

            ]

        })


        const rawSQL = sqlResponse.content[0].type === 'text'
            ? sqlResponse.content[0].text
            : ''


        const parsedSQL = parseClaudeJSON(rawSQL)

        const sql = parsedSQL.sql?.trim() ?? ''


        validateSQL(sql)


        console.log('Generated SQL:', sql)


        /*
        STEP 2
        ejecutar SQL
        */

        let queryResult: any[]


        try {

            queryResult = await prisma.$queryRawUnsafe(sql)


            queryResult = JSON.parse(

                JSON.stringify(

                    queryResult,

                    (_, value) =>

                        typeof value === 'bigint'
                            ? Number(value)
                            : value

                )

            )

        }

        catch (dbError: any) {

            res.status(500).json({

                error: `Error SQL: ${dbError.message}`

            })

            return

        }


        /*
        STEP 3
        interpreter rápido con Haiku
        */

        const interpretResponse = await client.messages.create({

            model: FAST_MODEL,

            max_tokens: 500,

            system: INTERPRETER_PROMPT,

            messages: [

                ...history.slice(-4),

                {

                    role: 'user',

                    content:

                        `Pregunta original:

${question}

Pregunta expandida:

${expandedQuestion}

Resultado:

${JSON.stringify(queryResult, null, 2)}`

                }

            ]

        })


        let answer = interpretResponse.content[0].type === 'text'
            ? interpretResponse.content[0].text
            : 'No pude interpretar la respuesta.'


        /*
        limpiar bloques SQL si aparecen
        */

        answer = answer
            .replace(/```sql[\s\S]*?```/gi, '')
            .replace(/```[\s\S]*?```/gi, '')
            .trim()


        res.json({

            answer,

            sql,

            data: queryResult

        })


    }

    catch (error: any) {

        console.error('AI query error:', error)

        res.status(500).json({

            error: 'Error procesando la consulta'

        })

    }

})


export default router