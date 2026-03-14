import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import uploadRouter from './routes/upload'


dotenv.config()

import workersRouter   from './routes/workers'
import companiesRouter from './routes/companies'
import contractsRouter from './routes/contracts'
import paymentsRouter  from './routes/payments'
import projectsRouter  from './routes/projects'
import authRouter      from './routes/auth'
import { authMiddleware } from './middleware/authMiddleware'


const app = express()

app.use(cors())
app.use(express.json())

// Rutas públicas
app.use('/api/auth', authRouter)

// Rutas protegidas
app.use('/api/workers',   authMiddleware, workersRouter)
app.use('/api/companies', authMiddleware, companiesRouter)
app.use('/api/contracts', authMiddleware, contractsRouter)
app.use('/api/payments',  authMiddleware, paymentsRouter)
app.use('/api/projects',  authMiddleware, projectsRouter)
app.use('/api/uploads', authMiddleware, uploadRouter)

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