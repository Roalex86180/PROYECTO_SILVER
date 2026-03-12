import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

import workersRouter   from './routes/workers'
import companiesRouter from './routes/companies'
import contractsRouter from './routes/contracts'
import paymentsRouter  from './routes/payments'
import projectsRouter  from './routes/projects'

const app = express()

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/workers',   workersRouter)
app.use('/api/companies', companiesRouter)
app.use('/api/contracts', contractsRouter)
app.use('/api/payments',  paymentsRouter)
app.use('/api/projects',  projectsRouter)
app.use('/contracts', contractsRouter)

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Silver Star API running' })
})

const PORT = Number(process.env.PORT) || 3001

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
})

process.on('SIGINT', () => process.exit(0))