import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { APP_CONFIG } from '../config'

export default function Login() {
  const navigate = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleLogin = async () => {
    if (!email || !password) { setError('Email and password are required'); return }
    setLoading(true)
    setError('')
    try {
      const { token, user } = await authService.login(email, password)
      authService.saveSession(token, user)
      navigate('/')
    } catch (e: any) {
      setError(e.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      <div className="w-full max-w-md">

        
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg mb-4 overflow-hidden">
            <img src="/icon-192.png" alt="Silver Star Logistic" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-white">{APP_CONFIG.name}</h1>
          <p className="text-blue-300 text-sm mt-1">ERP Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Sign in to your account</h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                Email
              </label>
              <input
                type="email"
                placeholder="email@example.com"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                onKeyDown={handleKeyDown}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </div>

        <p className="text-center text-blue-400 text-xs mt-6">
          {APP_CONFIG.name} © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}