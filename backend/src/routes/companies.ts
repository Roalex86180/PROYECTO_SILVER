import { Router, Request, Response } from 'express'
import prisma from '../utils/prisma'

const router = Router()

// GET todas las empresas
router.get('/', async (req: Request, res: Response) => {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { workers: true, contracts: true } } }
    })
    res.json(companies)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener empresas' })
  }
})

// GET empresa por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: String(req.params.id) },
      include: {
        workers: true,
        contracts: {
          include: { project: true, payments: true }
        }
      }
    })
    if (!company) {
      res.status(404).json({ error: 'Empresa no encontrada' })
      return
    }
    res.json(company)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener empresa' })
  }
})

// POST crear empresa
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, ein, contactPerson, phone, email, address, state, notes } = req.body

    if (!name || !ein) {
      res.status(400).json({ error: 'Nombre y EIN son requeridos' })
      return
    }

    const company = await prisma.company.create({
      data: { name, ein, contactPerson, phone, email, address, state, notes }
    })
    res.status(201).json(company)
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Ya existe una empresa con ese EIN' })
      return
    }
    res.status(500).json({ error: 'Error al crear empresa' })
  }
})

// PUT actualizar empresa
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, ein, contactPerson, phone, email, address, state, notes } = req.body
    const company = await prisma.company.update({
      where: { id: String(req.params.id) },
      data: { name, ein, contactPerson, phone, email, address, state, notes }
    })
    res.json(company)
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar empresa' })
  }
})

// DELETE empresa
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.company.delete({ where: { id: String(req.params.id) } })
    res.json({ message: 'Empresa eliminada' })
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar empresa' })
  }
})

export default router