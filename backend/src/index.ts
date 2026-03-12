import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'

if (process.env.NODE_ENV !== 'production') {
  dotenv.config()
}

import workersRouter   from './routes/workers'
import companiesRouter from './routes/companies'
import contractsRouter from './routes/contracts'
import paymentsRouter  from './routes/payments'
import projectsRouter  from './routes/projects'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/workers',   workersRouter)
app.use('/api/companies', companiesRouter)
app.use('/api/contracts', contractsRouter)
app.use('/api/payments',  paymentsRouter)
app.use('/api/projects',  projectsRouter)

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Silver Star API running' })
})

// servir frontend
const frontendPath = path.join(process.cwd(), '../frontend/dist')

app.use(express.static(frontendPath))

app.use((_req: Request, res: Response) => {
  res.sendFile(path.join(frontendPath, 'index.html'))
})

const PORT = Number(process.env.PORT) || 3001

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
})