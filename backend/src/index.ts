import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import uploadRouter from './routes/upload'
import routesRouter from './routes/routes'
import localsRouter from './routes/locals'
import expensesRouter from './routes/expenses'
import aiRouter from './routes/ai'


dotenv.config()

import workersRouter   from './routes/workers'
import companiesRouter from './routes/companies'
import contractsRouter from './routes/contracts'
import paymentsRouter  from './routes/payments'
import projectsRouter  from './routes/projects'
import authRouter      from './routes/auth'
import { authMiddleware } from './middleware/authMiddleware'
import { trackEvent } from './utils/trackEvent'




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
app.use('/api/routes', authMiddleware, routesRouter)
app.use('/api/locals', authMiddleware, localsRouter)
app.use('/api/expenses', authMiddleware, expensesRouter)
app.use('/api/ai', authMiddleware, aiRouter)

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Silver Star API running' })
})

// servir frontend
const frontendPath = path.join(process.cwd(), '../frontend/dist')

app.use(express.static(frontendPath))

app.use((_req: Request, res: Response) => {
  res.sendFile(path.join(frontendPath, 'index.html'))
})

// ── Middleware global de errores — va antes del app.listen ──────────────────
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  trackEvent('error.server', {
    route: _req.path,
    method: _req.method,
    status_code: err.status ?? 500,
    message: err.message?.slice(0, 200),
  })
  console.error('Unhandled error:', err)
  res.status(err.status ?? 500).json({ error: 'Internal server error' })
})

const PORT = Number(process.env.PORT) || 3001

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
})