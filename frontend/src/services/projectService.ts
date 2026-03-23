import api from './api'

export type ProjectPayment = {
  id: string
  date: string
  amount: number
  concept: string
  method: string
  notes?: string
  workerName?: string | null
  companyName?: string | null
}

export type ProjectTeamMember = {
  id: string
  name: string
  role: string
  position?: string
  contractId?: string
  value?: number
  paymentType?: string
  payments?: ProjectPayment[]
}

export type ProjectCompany = {
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
  payments?: ProjectPayment[]
}

export type Project = {
  id: string
  name: string
  location?: string
  status: string
  createdAt: string
  description?: string
  clientContact?: string
  startDate?: string
  endDate?: string
  budget?: number | null
  spent?: number
  progress?: number
  team?: ProjectTeamMember[]
  companies?: ProjectCompany[]
  payments?: ProjectPayment[]
}

export type CreateProjectDto = {
  name: string
  description?: string
  clientContact?: string
  location?: string
  startDate?: string
  endDate?: string
  budget?: number
  status?: string
}

export type UpdateProjectDto = Partial<CreateProjectDto & {
  status: string
  spent: number
}>

export const projectService = {
  getAll: (): Promise<Project[]> =>
    api.get('/projects').then(r => r.data),

  getById: (id: string): Promise<Project> =>
    api.get(`/projects/${id}`).then(r => r.data),

  create: (data: CreateProjectDto): Promise<Project> =>
    api.post('/projects', data).then(r => r.data),

  update: (id: string, data: UpdateProjectDto): Promise<Project> =>
    api.patch(`/projects/${id}`, data).then(r => r.data),

  archive: (id: string): Promise<Project> =>
    api.patch(`/projects/${id}`, { status: 'archived' }).then(r => r.data),
}