import { Router, Request, Response } from 'express'
import prisma from '../utils/prisma'

const router = Router()

// GET /api/routes?projectId=xxx
router.get('/', async (req: Request, res: Response) => {
    try {
        const { projectId } = req.query
        const routes = await prisma.route.findMany({
            where: projectId ? { projectId: String(projectId) } : undefined,
            include: {
                locals: {
                    include: {
                        workers: { include: { worker: true } },
                        companies: { include: { company: true } }
                    }
                },
                companies: { include: { company: true } },
                workers: { include: { worker: true } }
            },
            orderBy: { createdAt: 'asc' }
        })
        res.json(routes)
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener rutas' })
    }
})

// GET /api/routes/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const route = await prisma.route.findUnique({
            where: { id: String(req.params.id) },
            include: {
                locals: {
                    include: {
                        workers: { include: { worker: true } },
                        companies: { include: { company: true } }
                    }
                },
                companies: { include: { company: true } },
                workers: { include: { worker: true } },
                project: true
            }
        })
        if (!route) {
            res.status(404).json({ error: 'Ruta no encontrada' })
            return
        }
        res.json(route)
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener ruta' })
    }
})

// POST /api/routes
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, projectId } = req.body
        if (!name || !projectId) {
            res.status(400).json({ error: 'name y projectId son requeridos' })
            return
        }
        const route = await prisma.route.create({
            data: { name, projectId }
        })
        res.status(201).json(route)
    } catch (error) {
        res.status(500).json({ error: 'Error al crear ruta' })
    }
})

// PUT /api/routes/:id
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { name } = req.body
        const route = await prisma.route.update({
            where: { id: String(req.params.id) },
            data: { name }
        })
        res.json(route)
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar ruta' })
    }
})

// DELETE /api/routes/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        await prisma.route.delete({ where: { id: String(req.params.id) } })
        res.json({ message: 'Ruta eliminada' })
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar ruta' })
    }
})

// POST /api/routes/:id/companies
router.post('/:id/companies', async (req: Request, res: Response) => {
    try {
        const { companyId } = req.body
        if (!companyId) {
            res.status(400).json({ error: 'companyId es requerido' })
            return
        }
        const relation = await prisma.routeCompany.create({
            data: { routeId: String(req.params.id), companyId: String(companyId) },
            include: { company: true }
        })
        res.status(201).json(relation)
    } catch (error) {
        res.status(500).json({ error: 'Error al asignar empresa' })
    }
})

// DELETE /api/routes/:id/companies/:companyId
router.delete('/:id/companies/:companyId', async (req: Request, res: Response) => {
    try {
        await prisma.routeCompany.delete({
            where: {
                routeId_companyId: {
                    routeId: String(req.params.id),
                    companyId: String(req.params.companyId)
                }
            }
        })
        res.json({ message: 'Empresa removida de la ruta' })
    } catch (error) {
        res.status(500).json({ error: 'Error al remover empresa' })
    }
})

// POST /api/routes/:id/workers
router.post('/:id/workers', async (req: Request, res: Response) => {
    try {
        const { workerId } = req.body
        if (!workerId) {
            res.status(400).json({ error: 'workerId es requerido' })
            return
        }
        const relation = await prisma.routeWorker.create({
            data: { routeId: String(req.params.id), workerId: String(workerId) },
            include: { worker: true }
        })
        res.status(201).json(relation)
    } catch (error) {
        res.status(500).json({ error: 'Error al asignar worker a ruta' })
    }
})

// DELETE /api/routes/:id/workers/:workerId
router.delete('/:id/workers/:workerId', async (req: Request, res: Response) => {
    try {
        await prisma.routeWorker.delete({
            where: {
                routeId_workerId: {
                    routeId: String(req.params.id),
                    workerId: String(req.params.workerId)
                }
            }
        })
        res.json({ message: 'Worker removido de la ruta' })
    } catch (error) {
        res.status(500).json({ error: 'Error al remover worker de la ruta' })
    }
})

export default router