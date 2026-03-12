import api from './api'

export type Company = {
  id: string
  name: string
  ein: string
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
  state?: string
  notes?: string
  createdAt: string
}

export type CreateCompanyDto = Omit<Company, 'id' | 'createdAt'>

export const companyService = {
  getAll: async (): Promise<Company[]> => {
    const res = await api.get('/companies')
    return res.data
  },
  create: async (data: CreateCompanyDto): Promise<Company> => {
    const res = await api.post('/companies', data)
    return res.data
  },
  update: async (id: string, data: Partial<CreateCompanyDto>): Promise<Company> => {
    const res = await api.put(`/companies/${id}`, data)
    return res.data
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/companies/${id}`)
  }
}