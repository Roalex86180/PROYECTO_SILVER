import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { FolderKanban, Users, ChevronLeft, ChevronRight, LogOut, KeyRound, X, Menu, Receipt } from 'lucide-react'
import clsx from 'clsx'
import { authService } from '../services/authService'
import { APP_CONFIG } from '../config'
import api from '../services/api'
import { Sparkles } from 'lucide-react'

const NAV = [
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/hr', label: 'Human Resources', icon: Users },
  { to: '/expenses', label: `${APP_CONFIG.name} Expenses`, icon: Receipt },
  { to: '/ai', label: 'AI Assistant', icon: Sparkles },
]

// ─── Change Password Modal ────────────────────────────────────────────────────
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: string) => { setForm(p => ({ ...p, [k]: v })); setError('') }

  const handleSave = async () => {
    if (!form.current || !form.next || !form.confirm) { setError('All fields are required'); return }
    if (form.next.length < 6) { setError('New password must be at least 6 characters'); return }
    if (form.next !== form.confirm) { setError('Passwords do not match'); return }
    setSaving(true)
    try {
      await api.put('/auth/change-password', { currentPassword: form.current, newPassword: form.next })
      setSuccess(true)
      setTimeout(onClose, 1500)
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error changing password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <KeyRound size={16} className="text-blue-600" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">Change Password</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-3">
          {success ? (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg text-center">
              ✅ Password changed successfully
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Current Password</label>
                <input type="password" placeholder="••••••••"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.current} onChange={e => set('current', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">New Password</label>
                <input type="password" placeholder="••••••••"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.next} onChange={e => set('next', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Confirm New Password</label>
                <input type="password" placeholder="••••••••"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.confirm} onChange={e => set('confirm', e.target.value)} />
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}
            </>
          )}
        </div>
        {!success && (
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <button onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save Password'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showChangePass, setShowChangePass] = useState(false)
  const navigate = useNavigate()
  const user = authService.getUser()

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }

  const closeMobile = () => setMobileOpen(false)

  return (
    <div className="flex h-screen bg-gray-100 text-gray-900">

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={closeMobile} />
      )}

      {/* SIDEBAR */}
      <aside className={clsx(
        'fixed md:relative z-40 flex flex-col transition-all duration-300 ease-in-out h-full bg-blue-950',
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        collapsed ? 'w-16' : 'w-60'
      )}>

        <div className={clsx(
          'h-16 flex items-center border-b border-blue-900 overflow-hidden transition-all duration-300',
          collapsed ? 'justify-center' : 'gap-3 px-5'
        )}>
          {collapsed ? (
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">SSL</span>
            </div>
          ) : (
            <div>
              <p className="text-sm font-bold text-white leading-none">{APP_CONFIG.name.split(' ').slice(0, 2).join(' ')}</p>
              <p className="text-xs text-blue-300 mt-0.5">{APP_CONFIG.name.split(' ').slice(2).join(' ')}</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-1 mt-2">
          {!collapsed && (
            <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest px-3 pt-1 pb-2">Menu</p>
          )}
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} title={collapsed ? label : ''}
              onClick={closeMobile}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150',
                collapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5',
                isActive ? 'bg-blue-500 text-white shadow-sm' : 'text-blue-200 hover:bg-blue-900 hover:text-white'
              )}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="px-5 py-4 border-t border-blue-900">
            <p className="text-xs text-blue-300">{APP_CONFIG.name}</p>
            <p className="text-xs text-blue-500">© {APP_CONFIG.year}</p>
          </div>
        )}

        <button onClick={() => setCollapsed(v => !v)}
          className="hidden md:flex absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center shadow-sm hover:shadow-md hover:border-blue-400 transition-all z-10">
          {collapsed ? <ChevronRight size={12} className="text-blue-600" /> : <ChevronLeft size={12} className="text-blue-600" />}
        </button>
      </aside>

      {/* RIGHT SIDE */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* TOPBAR */}
        <header className="h-16 shrink-0 flex items-center justify-between px-4 md:px-6"
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)',
            boxShadow: '0 1px 12px rgba(30,64,175,0.25)'
          }}
        >
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(v => !v)}
              className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-blue-200 hover:bg-white/10 transition-all">
              <Menu size={18} />
            </button>
            <div className="w-8 h-8 rounded-lg overflow-hidden items-center justify-center hidden md:flex">
              <img src="/icon-192.png" alt={APP_CONFIG.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none tracking-wide">{APP_CONFIG.name}</p>
              <p className="text-[11px] text-blue-300 mt-0.5 tracking-wider uppercase hidden md:block">Management System</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="text-right hidden md:block">
              <p className="text-xs font-semibold text-white">{user?.name || 'Admin'}</p>
              <p className="text-[11px] text-blue-300">Administrator</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <button onClick={() => setShowChangePass(true)} title="Change password"
              className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-blue-200 hover:bg-white/20 hover:text-white transition-all">
              <KeyRound size={14} />
            </button>
            <button onClick={handleLogout} title="Sign out"
              className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-blue-200 hover:bg-red-500/30 hover:text-white hover:border-red-400/50 transition-all">
              <LogOut size={14} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {showChangePass && <ChangePasswordModal onClose={() => setShowChangePass(false)} />}
    </div>
  )
}