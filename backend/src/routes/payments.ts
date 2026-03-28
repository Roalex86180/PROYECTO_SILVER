import { Router, Request, Response } from 'express'
import prisma from '../utils/prisma'
import { trackEvent } from '../utils/trackEvent'

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
        date: new Date(date + 'T12:00:00'),
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

    trackEvent('payment.created', {
      paymentId: payment.id,
      concept,
      method,
    })

    res.status(201).json(payment)
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar pago' })
  }
})

export default router