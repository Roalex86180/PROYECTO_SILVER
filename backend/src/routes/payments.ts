import { Router, Request, Response } from 'express'
import prisma from '../utils/prisma'

const router = Router()

// GET todos los pagos
router.get('/', async (req: Request, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { date: 'desc' },
      include: {
        contract: {
          include: { worker: true, company: true, project: true }
        }
      }
    })
    res.json(payments)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pagos' })
  }
})

// POST registrar pago
router.post('/', async (req: Request, res: Response) => {
  try {
    const { contractId, concept, amount, date, method, notes, receiptUrl } = req.body

    if (!contractId || !concept || !amount || !date || !method) {
      res.status(400).json({ error: 'Contrato, concepto, monto, fecha y método son requeridos' })
      return
    }

    const payment = await prisma.payment.create({
      data: {
        contractId,
        concept,
        amount,
        date: new Date(date),
        method,
        notes,
        receiptUrl: receiptUrl || null
      },
      include: {
        contract: {
          include: { worker: true, company: true, project: true }
        }
      }
    })
    res.status(201).json(payment)
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar pago' })
  }
})
export default router