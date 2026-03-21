import api from './api'

export const localService = {

    getByRoute: async (routeId: string) => {
        const res = await api.get(`/locals?routeId=${routeId}`)
        return res.data
    },

    getById: async (id: string) => {
        const res = await api.get(`/locals/${id}`)
        return res.data
    },

    create: async (data: {
        name: string
        routeId: string
        budget?: number
        location?: string
        address?: string
        zipCode?: string
    }) => {
        const res = await api.post('/locals', data)
        return res.data
    },

    update: async (id: string, data: {
        name?: string
        budget?: number
        location?: string
        address?: string
        zipCode?: string
    }) => {
        const res = await api.put(`/locals/${id}`, data)
        return res.data
    },

    delete: async (id: string) => {
        const res = await api.delete(`/locals/${id}`)
        return res.data
    },

    // Workers
    assignWorker: async (localId: string, workerId: string) => {
        const res = await api.post(`/locals/${localId}/workers`, { workerId })
        return res.data
    },

    removeWorker: async (localId: string, workerId: string) => {
        const res = await api.delete(`/locals/${localId}/workers/${workerId}`)
        return res.data
    },

    // Companies
    assignCompany: async (localId: string, companyId: string) => {
        const res = await api.post(`/locals/${localId}/companies`, { companyId })
        return res.data
    },

    removeCompany: async (localId: string, companyId: string) => {
        const res = await api.delete(`/locals/${localId}/companies/${companyId}`)
        return res.data
    }
}