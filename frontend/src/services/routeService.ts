import api from './api'

export const routeService = {

    getByProject: async (projectId: string) => {
        const res = await api.get(`/routes?projectId=${projectId}`)
        return res.data
    },

    getById: async (id: string) => {
        const res = await api.get(`/routes/${id}`)
        return res.data
    },

    create: async (data: { name: string; projectId: string }) => {
        const res = await api.post('/routes', data)
        return res.data
    },

    update: async (id: string, data: { name: string }) => {
        const res = await api.put(`/routes/${id}`, data)
        return res.data
    },

    delete: async (id: string) => {
        const res = await api.delete(`/routes/${id}`)
        return res.data
    },

    assignCompany: async (routeId: string, companyId: string) => {
        const res = await api.post(`/routes/${routeId}/companies`, { companyId })
        return res.data
    },

    removeCompany: async (routeId: string, companyId: string) => {
        const res = await api.delete(`/routes/${routeId}/companies/${companyId}`)
        return res.data
    },

    assignWorker: async (routeId: string, workerId: string) => {
        const res = await api.post(`/routes/${routeId}/workers`, { workerId })
        return res.data
    },

    removeWorker: async (routeId: string, workerId: string) => {
        const res = await api.delete(`/routes/${routeId}/workers/${workerId}`)
        return res.data
    }
}