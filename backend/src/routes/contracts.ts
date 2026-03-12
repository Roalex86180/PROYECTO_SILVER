import { Router, Request, Response } from 'express'
import prisma from '../utils/prisma'

const router = Router()

// GET todos los contratos
router.get('/', async (req: Request, res: Response) => {
  try {
    const contracts = await prisma.contract.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        worker: true,
        company: true,
        project: true,
        payments: true
      }
    })
    res.json(contracts)
  } catch (error) {
    console.error('ERROR GET contracts:', error)
    res.status(500).json({ error: 'Error al obtener contratos' })
  }
})

// GET contrato por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: String(req.params.id) },
      include: {
        worker: true,
        company: true,
        project: true,
        payments: true
      }
    })
    if (!contract) {
      res.status(404).json({ error: 'Contrato no encontrado' })
      return
    }
    res.json(contract)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener contrato' })
  }
})

// POST crear contrato
router.post('/', async (req: Request, res: Response) => {
  try {
    const { workerId, companyId, projectId, startDate, endDate, paymentType, value } = req.body

    if (!projectId || !startDate || !endDate || !paymentType || !value) {
      res.status(400).json({ error: 'Proyecto, fechas, tipo de pago y valor son requeridos' })
      return
    }

    if (!workerId && !companyId) {
      res.status(400).json({ error: 'Debe asignarse a un trabajador o una empresa' })
      return
    }

    const contract = await prisma.contract.create({
      data: {
        workerId:    workerId  || null,
        companyId:   companyId || null,
        projectId,
        startDate:   new Date(startDate),
        endDate:     new Date(endDate),
        paymentType,
        value
      },
      include: {
        worker: true,
        company: true,
        project: true
      }
    })
    res.status(201).json(contract)
  } catch (error) {
    console.error('ERROR GET workers:', error)
    res.status(500).json({ error: 'Error al crear contrato' })
  }
})

// PUT actualizar contrato
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, paymentType, value } = req.body

    if (!startDate || !endDate || !paymentType || !value) {
      res.status(400).json({ error: 'Fechas, tipo de pago y valor son requeridos' })
      return
    }

    const contract = await prisma.contract.update({
      where: { id: String(req.params.id) },
      data: {
        startDate:   new Date(startDate),
        endDate:     new Date(endDate),
        paymentType,
        value:       Number(value)
      },
      include: {
        worker: true,
        company: true,
        project: true,
        payments: true
      }
    })
    res.json(contract)
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar contrato' })
  }
})

export default router