import api from './api'

export type Payment = {
  id: string
  contractId: string
  concept: string
  amount: number
  date: string
  method: string
  notes?: string
  createdAt: string
}

export type CreatePaymentDto = Omit<Payment, 'id' | 'createdAt'>

export const paymentService = {
  getAll: async (): Promise<Payment[]> => {
    const res = await api.get('/payments')
    return res.data
  },
  create: async (data: CreatePaymentDto): Promise<Payment> => {
    const res = await api.post('/payments', data)
    return res.data
  }
}