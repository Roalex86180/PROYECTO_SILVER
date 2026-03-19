import type { Project } from '../../services/projectService'

export type Payment = {
    id: string
    date: string
    amount: number
    concept: string
    method: string
    notes?: string
    workerName?: string | null
    companyName?: string | null
}

export type TeamMember = {
    id: string
    name: string
    role: string
    position?: string
    value?: number
    paymentType?: string
    payments?: Payment[]
}

export type ContractedCompany = {
    id: string
    contractId: string
    name: string
    ein?: string
    contactPerson?: string | null
    phone?: string | null
    startDate?: string
    endDate?: string
    value?: number
    paymentType?: string
    payments?: Payment[]
}

export type ProjectDetail = Project & {
    description?: string
    clientContact?: string
    startDate?: string
    endDate?: string
    budget?: number | null
    spent?: number
    progress?: number
    team?: TeamMember[]
    companies?: ContractedCompany[]
    payments?: Payment[]
}