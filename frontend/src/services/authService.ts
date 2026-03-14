import api from './api'

export type AuthUser = {
  id: string
  email: string
  name: string
  role: string
}

export const authService = {
  login: async (email: string, password: string): Promise<{ token: string; user: AuthUser }> => {
    const res = await api.post('/auth/login', { email, password })
    return res.data
  },

  saveSession: (token: string, user: AuthUser) => {
    sessionStorage.setItem('token', token)
    sessionStorage.setItem('user', JSON.stringify(user))
  },

  getToken: (): string | null => {
    return sessionStorage.getItem('token')
  },

  getUser: (): AuthUser | null => {
    const u = sessionStorage.getItem('user')
    return u ? JSON.parse(u) : null
  },

  logout: () => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
  },

  isAuthenticated: (): boolean => {
    return !!sessionStorage.getItem('token')
  }
}