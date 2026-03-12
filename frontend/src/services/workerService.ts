import api from './api'

export type Worker = {
  id: string
  name: string
  ssn: string
  ein?: string
  phone?: string
  email?: string
  address?: string
  state?: string
  workAuthorization: string
  role: string
  type: string
  companyId?: string
  emergencyContact?: string
  emergencyPhone?: string
  createdAt: string
}

export type CreateWorkerDto = Omit<Worker, 'id' | 'createdAt'>

export const workerService = {
  getAll: async (): Promise<Worker[]> => {
    const res = await api.get('/workers')
    return res.data
  },
  getById: async (id: string): Promise<Worker> => {
    const res = await api.get(`/workers/${id}`)
    return res.data
  },
  create: async (data: CreateWorkerDto): Promise<Worker> => {
    const res = await api.post('/workers', data)
    return res.data
  },
  update: async (id: string, data: Partial<CreateWorkerDto>): Promise<Worker> => {
    const res = await api.put(`/workers/${id}`, data)
    return res.data
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/workers/${id}`)
  }
}