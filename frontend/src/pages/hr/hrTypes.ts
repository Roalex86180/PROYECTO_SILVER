import type { Worker } from '../../services/workerService'
import type { Contract } from '../../services/contractService'

export type Payment = {
    id: string
    concept: string
    amount: string
    date: string
    method: string
    notes?: string
    receiptUrl?: string
}

export type ContractLocal = {
    id: string
    projectId: string
    startDate: string
    endDate: string
    paymentType: string
    value: string
    project: { id: string; name: string; location?: string }
    payments: Payment[]
}

export type ContractFull = Contract & {
    worker?: { id: string; name: string; role: string }
    company?: { id: string; name: string; ein: string }
    payments: Payment[]
}

export type WorkerDetail = Worker & { contracts: ContractLocal[] }