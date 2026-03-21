import { Router, Request, Response } from 'express'
import prisma from '../utils/prisma'

const router = Router()

// GET /api/locals?routeId=xxx
router.get('/', async (req: Request, res: Response) => {
    try {
        const { routeId } = req.query
        const locals = await prisma.local.findMany({
            where: routeId ? { routeId: String(routeId) } : undefined,
            include: {
                workers: { include: { worker: true } },
                companies: { include: { company: true } }
            },
            orderBy: { createdAt: 'asc' }
        })
        res.json(locals)
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener locales' })
    }
})

// GET /api/locals/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const local = await prisma.local.findUnique({
            where: { id: String(req.params.id) },
            include: {
                workers: { include: { worker: true } },
                companies: { include: { company: true } },
                route: { include: { project: true } }
            }
        })
        if (!local) {
            res.status(404).json({ error: 'Local no encontrado' })
            return
        }
        res.json(local)
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener local' })
    }
})

// POST /api/locals
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, budget, location, address, zipCode, routeId } = req.body
        if (!name || !routeId) {
            res.status(400).json({ error: 'name y routeId son requeridos' })
            return
        }
        const local = await prisma.local.create({
            data: { name, budget, location, address, zipCode, routeId }
        })
        res.status(201).json(local)
    } catch (error) {
        res.status(500).json({ error: 'Error al crear local' })
    }
})

// PUT /api/locals/:id
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { name, budget, location, address, zipCode } = req.body
        const local = await prisma.local.update({
            where: { id: String(req.params.id) },
            data: { name, budget, location, address, zipCode }
        })
        res.json(local)
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar local' })
    }
})

// DELETE /api/locals/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        await prisma.local.delete({ where: { id: String(req.params.id) } })
        res.json({ message: 'Local eliminado' })
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar local' })
    }
})

// POST /api/locals/:id/workers
router.post('/:id/workers', async (req: Request, res: Response) => {
    try {
        const { workerId } = req.body
        if (!workerId) {
            res.status(400).json({ error: 'workerId es requerido' })
            return
        }
        const relation = await prisma.localWorker.create({
            data: { localId: String(req.params.id), workerId: String(workerId) },
            include: { worker: true }
        })
        res.status(201).json(relation)
    } catch (error) {
        res.status(500).json({ error: 'Error al asignar worker' })
    }
})

// DELETE /api/locals/:id/workers/:workerId
router.delete('/:id/workers/:workerId', async (req: Request, res: Response) => {
    try {
        await prisma.localWorker.delete({
            where: {
                localId_workerId: {
                    localId: String(req.params.id),
                    workerId: String(req.params.workerId)
                }
            }
        })
        res.json({ message: 'Worker removido del local' })
    } catch (error) {
        res.status(500).json({ error: 'Error al remover worker' })
    }
})

// POST /api/locals/:id/companies
router.post('/:id/companies', async (req: Request, res: Response) => {
    try {
        const { companyId } = req.body
        if (!companyId) {
            res.status(400).json({ error: 'companyId es requerido' })
            return
        }
        const relation = await prisma.localCompany.create({
            data: { localId: String(req.params.id), companyId: String(companyId) },
            include: { company: true }
        })
        res.status(201).json(relation)
    } catch (error) {
        res.status(500).json({ error: 'Error al asignar empresa al local' })
    }
})

// DELETE /api/locals/:id/companies/:companyId
router.delete('/:id/companies/:companyId', async (req: Request, res: Response) => {
    try {
        await prisma.localCompany.delete({
            where: {
                localId_companyId: {
                    localId: String(req.params.id),
                    companyId: String(req.params.companyId)
                }
            }
        })
        res.json({ message: 'Empresa removida del local' })
    } catch (error) {
        res.status(500).json({ error: 'Error al remover empresa del local' })
    }
})

export default router