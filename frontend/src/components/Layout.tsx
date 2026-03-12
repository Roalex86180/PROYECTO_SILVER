import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { FolderKanban, Users, Building2, ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { to: '/projects', label: 'Projects',        icon: FolderKanban },
  { to: '/hr',       label: 'Human Resources', icon: Users },
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-gray-100 text-gray-900">

      {/* SIDEBAR — unchanged */}
      <aside className={clsx(
        'relative flex flex-col transition-all duration-300 ease-in-out',
        'bg-blue-950',
        collapsed ? 'w-16' : 'w-60'
      )}>

        {/* Logo */}
        <div className={clsx(
          'h-16 flex items-center border-b border-blue-900 overflow-hidden transition-all duration-300',
          collapsed ? 'justify-center' : 'gap-3 px-5'
        )}>
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
            <Building2 size={16} className="text-white" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-bold text-white leading-none">Silver Star</p>
              <p className="text-xs text-blue-300 mt-0.5">Logistic</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-1 mt-2">
          {!collapsed && (
            <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest px-3 pt-1 pb-2">
              Menu
            </p>
          )}
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : ''}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150',
                collapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5',
                isActive
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-blue-200 hover:bg-blue-900 hover:text-white'
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
            <p className="text-xs text-blue-300">Silver Star Logistic</p>
            <p className="text-xs text-blue-500">© 2025</p>
          </div>
        )}

        {/* Toggle button */}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md hover:border-blue-400 transition-all z-10"
        >
          {collapsed
            ? <ChevronRight size={12} className="text-blue-600" />
            : <ChevronLeft size={12} className="text-blue-600" />
          }
        </button>

      </aside>

      {/* RIGHT SIDE */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* TOPBAR — refined */}
        <header className="h-16 shrink-0 flex items-center justify-between px-6"
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)',
            boxShadow: '0 1px 12px rgba(30,64,175,0.25)'
          }}
        >
          {/* Left: branding */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
              <Building2 size={15} className="text-blue-200" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none tracking-wide">Silver Star Logistic</p>
              <p className="text-[11px] text-blue-300 mt-0.5 tracking-wider uppercase">Management System</p>
            </div>
          </div>

          {/* Right: user */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-semibold text-white">Admin</p>
              <p className="text-[11px] text-blue-300">Administrator</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-white text-xs font-bold">
              A
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>

      </div>
    </div>
  )
}