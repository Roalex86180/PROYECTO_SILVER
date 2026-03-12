import { Router, Request, Response } from 'express'
import prisma from '../utils/prisma'

const router = Router()

// GET todos los trabajadores
router.get('/', async (req: Request, res: Response) => {
  try {
    const workers = await prisma.worker.findMany({
      orderBy: { createdAt: 'desc' },
      include: { company: true }
    })
    res.json(workers)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener trabajadores' })
  }
})

// GET trabajador por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const worker = await prisma.worker.findUnique({
      where: { id: String(req.params.id) },
      include: {
        company: true,
        contracts: {
          include: {
            project: true,
            payments: true
          }
        }
      }
    })
    if (!worker) {
      res.status(404).json({ error: 'Trabajador no encontrado' })
      return
    }
    res.json(worker)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener trabajador' })
  }
})

// POST crear trabajador
router.post('/', async (req: Request, res: Response) => {
  console.log('Body recibido:', req.body)
  try {
    const {
      name, ssn, ein, phone, email,
      address, state, workAuthorization,
      role, type, companyId,
      emergencyContact, emergencyPhone
    } = req.body

    if (!name || !ssn || !role || !type || !workAuthorization) {
      res.status(400).json({ error: 'Nombre, SSN, cargo, tipo y autorización de trabajo son requeridos' })
      return
    }

    const worker = await prisma.worker.create({
      data: {
        name,
        ssn,
        ein:              ein              || null,
        phone:            phone            || null,
        email:            email            || null,
        address:          address          || null,
        state:            state            || null,
        workAuthorization,
        role,
        type,
        companyId:        companyId        || null,
        emergencyContact: emergencyContact || null,
        emergencyPhone:   emergencyPhone   || null,
      }
    })
    res.status(201).json(worker)
  } catch (error: any) {
    console.error('ERROR COMPLETO:', error.message)
    console.error('CODIGO:', error.code)
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Ya existe un trabajador con ese SSN' })
      return
    }
    res.status(500).json({ error: 'Error al crear trabajador' })
  }
})



// PUT actualizar trabajador
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const {
      name, ssn, ein, phone, email,
      address, state, workAuthorization,
      role, type, companyId,
      emergencyContact, emergencyPhone
    } = req.body

    const worker = await prisma.worker.update({
      where: { id: String(req.params.id) },
      data: {
        name, ssn, ein, phone, email,
        address, state, workAuthorization,
        role, type, companyId,
        emergencyContact, emergencyPhone
      }
    })
    res.json(worker)
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar trabajador' })
  }
})

// DELETE trabajador
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.worker.delete({
      where: { id: String(req.params.id) }
    })
    res.json({ message: 'Trabajador eliminado' })
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar trabajador' })
  }
})

export default router