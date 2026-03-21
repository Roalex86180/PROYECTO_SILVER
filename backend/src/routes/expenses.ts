import { Router, Request, Response } from 'express'
import prisma from '../utils/prisma'

const router = Router()

// GET /api/expenses
router.get('/', async (req: Request, res: Response) => {
    try {
        const { projectId, companyId } = req.query
        const expenses = await prisma.expense.findMany({
            where: {
                ...(projectId ? { projectId: String(projectId) } : {}),
                ...(companyId ? { companyId: String(companyId) } : {}),
            },
            include: {
                project: { select: { id: true, name: true } },
                company: { select: { id: true, name: true } },
            },
            orderBy: { date: 'desc' }
        })
        res.json(expenses)
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener gastos' })
    }
})

// GET /api/expenses/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const expense = await prisma.expense.findUnique({
            where: { id: String(req.params.id) },
            include: {
                project: { select: { id: true, name: true } },
                company: { select: { id: true, name: true } },
            }
        })
        if (!expense) {
            res.status(404).json({ error: 'Gasto no encontrado' })
            return
        }
        res.json(expense)
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener gasto' })
    }
})

// POST /api/expenses
router.post('/', async (req: Request, res: Response) => {
    try {
        const { description, amount, date, category, paymentMethod, notes, receiptUrl, projectId, companyId } = req.body
        if (!description || !amount || !date) {
            res.status(400).json({ error: 'description, amount y date son requeridos' })
            return
        }
        const expense = await prisma.expense.create({
            data: {
                description,
                amount,
                date: new Date(date),
                category: category || 'General',
                paymentMethod,
                notes,
                receiptUrl,
                projectId: projectId || null,
                companyId: companyId || null,
            },
            include: {
                project: { select: { id: true, name: true } },
                company: { select: { id: true, name: true } },
            }
        })
        res.status(201).json(expense)
    } catch (error) {
        res.status(500).json({ error: 'Error al crear gasto' })
    }
})

// PUT /api/expenses/:id
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { description, amount, date, category, paymentMethod, notes, receiptUrl, projectId, companyId } = req.body
        const expense = await prisma.expense.update({
            where: { id: String(req.params.id) },
            data: {
                description,
                amount,
                date: date ? new Date(date) : undefined,
                category,
                paymentMethod,
                notes,
                receiptUrl,
                projectId: projectId || null,
                companyId: companyId || null,
            },
            include: {
                project: { select: { id: true, name: true } },
                company: { select: { id: true, name: true } },
            }
        })
        res.json(expense)
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar gasto' })
    }
})

// DELETE /api/expenses/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        await prisma.expense.delete({ where: { id: String(req.params.id) } })
        res.json({ message: 'Gasto eliminado' })
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar gasto' })
    }
})

export default router