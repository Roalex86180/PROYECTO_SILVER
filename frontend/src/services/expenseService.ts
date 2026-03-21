import api from './api'

export type Expense = {
    id: string
    description: string
    amount: number
    date: string
    category: string
    paymentMethod?: string
    notes?: string
    receiptUrl?: string
    projectId?: string
    companyId?: string
    project?: { id: string; name: string }
    company?: { id: string; name: string }
    createdAt: string
}

export type CreateExpenseDto = Omit<Expense, 'id' | 'createdAt' | 'project' | 'company'>

export const expenseService = {
    getAll: async (filters?: { projectId?: string; companyId?: string }): Promise<Expense[]> => {
        const params = new URLSearchParams()
        if (filters?.projectId) params.append('projectId', filters.projectId)
        if (filters?.companyId) params.append('companyId', filters.companyId)
        const res = await api.get(`/expenses${params.toString() ? '?' + params : ''}`)
        return res.data
    },

    create: async (data: CreateExpenseDto): Promise<Expense> => {
        const res = await api.post('/expenses', data)
        return res.data
    },

    update: async (id: string, data: Partial<CreateExpenseDto>): Promise<Expense> => {
        const res = await api.put(`/expenses/${id}`, data)
        return res.data
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/expenses/${id}`)
    }
}