import { Router, Request, Response } from 'express'
import prisma from '../utils/prisma'

const router = Router()

// ─── Helper: shape a project with separated companies / workers ───────────────
function shapeProject(p: any) {
  const companyContracts = p.contracts.filter((c: any) => c.companyId)
  const workerContracts  = p.contracts.filter((c: any) => c.workerId)

  // All payments across every contract (with context)
  const allPayments = p.contracts.flatMap((c: any) =>
    c.payments.map((pay: any) => ({
      id:          pay.id,
      date:        pay.date,
      amount:      Number(pay.amount),
      concept:     pay.concept,
      method:      pay.method,
      notes:       pay.notes,
      contractId:  c.id,
      workerName:  c.worker?.name  ?? null,
      companyName: c.company?.name ?? null,
    }))
  )

  const spent = allPayments.reduce((s: number, pay: any) => s + pay.amount, 0)

  // Unique workers with their contract details + payments
  const teamMap = new Map<string, any>()
  workerContracts.forEach((c: any) => {
    if (c.worker && !teamMap.has(c.worker.id)) {
      teamMap.set(c.worker.id, {
        id:          c.worker.id,
        name:        c.worker.name,
        role:        c.worker.role,
        position:    c.worker.type,
        contractId:  c.id,
        startDate:   c.startDate,
        endDate:     c.endDate,
        value:       Number(c.value),
        paymentType: c.paymentType,
        payments:    c.payments.map((pay: any) => ({
          id: pay.id, date: pay.date,
          amount: Number(pay.amount),
          concept: pay.concept, method: pay.method, notes: pay.notes,
        })),
      })
    }
  })

  // Companies — one entry per contract (same company can have multiple contracts)
  const companiesList: any[] = companyContracts
    .filter((c: any) => c.company)
    .map((c: any) => ({
      id:            c.company.id,
      contractId:    c.id,
      name:          c.company.name,
      ein:           c.company.ein,
      contactPerson: c.company.contactPerson,
      phone:         c.company.phone,
      email:         c.company.email,
      startDate:     c.startDate,
      endDate:       c.endDate,
      value:         Number(c.value),
      paymentType:   c.paymentType,
      payments:      c.payments.map((pay: any) => ({
        id: pay.id, date: pay.date,
        amount: Number(pay.amount),
        concept: pay.concept, method: pay.method, notes: pay.notes,
      })),
    }))

  return {
    id:            p.id,
    name:          p.name,
    location:      p.location,
    status:        p.status,
    description:   p.description,
    clientContact: p.clientContact,
    startDate:     p.startDate,
    endDate:       p.endDate,
    budget:        p.budget ? Number(p.budget) : null,
    progress:      p.progress ?? 0,
    createdAt:     p.createdAt,
    spent,
    team:          Array.from(teamMap.values()),
    companies:     companiesList,
    payments:      allPayments,
  }
}

const INCLUDE_ALL = {
  contracts: {
    include: { company: true, worker: true, payments: true }
  }
}

// ─── GET all projects ────────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: INCLUDE_ALL,
    })
    res.json(projects.map(shapeProject))
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener proyectos' })
  }
})

// ─── GET project by ID ───────────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: String(req.params.id) },
      include: INCLUDE_ALL,
    })
    if (!project) {
      res.status(404).json({ error: 'Proyecto no encontrado' })
      return
    }
    res.json(shapeProject(project))
  } catch (error) {
    console.error('ERROR GET workers:', error)
    res.status(500).json({ error: 'Error al obtener proyecto' })
  }
})

// ─── POST create project ─────────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, location, status, description, clientContact, startDate, endDate, budget } = req.body
    if (!name) { res.status(400).json({ error: 'Nombre requerido' }); return }

    const project = await prisma.project.create({
      data: {
        name,
        location:      location      || null,
        status:        status        || 'active',
        description:   description   || null,
        clientContact: clientContact || null,
        startDate:     startDate     ? new Date(startDate) : null,
        endDate:       endDate       ? new Date(endDate)   : null,
        budget:        budget        ? Number(budget)      : null,
        progress:      0,
      }
    })
    res.status(201).json(project)
  } catch (error) {
    console.error('ERROR GET workers:', error)
    res.status(500).json({ error: 'Error al crear proyecto' })
  }
})

// ─── PATCH update project ────────────────────────────────────────────────────
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { name, location, status, description, clientContact, startDate, endDate, budget, progress } = req.body

    const project = await prisma.project.update({
      where: { id: String(req.params.id) },
      data: {
        ...(name          !== undefined && { name }),
        ...(location      !== undefined && { location }),
        ...(status        !== undefined && { status }),
        ...(description   !== undefined && { description }),
        ...(clientContact !== undefined && { clientContact }),
        ...(startDate     !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate       !== undefined && { endDate:   endDate   ? new Date(endDate)   : null }),
        ...(budget        !== undefined && { budget: budget ? Number(budget) : null }),
        ...(progress      !== undefined && { progress: Number(progress) }),
      }
    })
    res.json(project)
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar proyecto' })
  }
})

// ─── DELETE project ──────────────────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.project.delete({ where: { id: String(req.params.id) } })
    res.json({ message: 'Proyecto eliminado' })
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar proyecto' })
  }
})

export default router