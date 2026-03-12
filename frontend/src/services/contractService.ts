import api from './api'

export type Contract = {
  id: string
  workerId?:  string
  companyId?: string
  projectId:  string
  project?:   { id: string; name: string; location?: string }
  worker?:    { id: string; name: string; role: string }
  company?:   { id: string; name: string; ein: string }
  startDate:  string
  endDate:    string
  paymentType: string
  value:      number
  createdAt:  string
  payments?:  {
    id: string; concept: string; amount: string
    date: string; method: string; notes?: string
  }[]
}

export type CreateContractDto = {
  workerId?:   string
  companyId?:  string
  projectId:   string
  startDate:   string
  endDate:     string
  paymentType: string
  value:       number
}

export type UpdateContractDto = {
  startDate:   string
  endDate:     string
  paymentType: string
  value:       number
}

export const contractService = {
  getAll: async (): Promise<Contract[]> => {
    const res = await api.get('/contracts')
    return res.data
  },
  getById: async (id: string): Promise<Contract> => {
    const res = await api.get(`/contracts/${id}`)
    return res.data
  },
  create: async (data: CreateContractDto): Promise<Contract> => {
    const res = await api.post('/contracts', data)
    return res.data
  },
  update: async (id: string, data: UpdateContractDto): Promise<Contract> => {
    const res = await api.put(`/contracts/${id}`, data)
    return res.data
  }
}