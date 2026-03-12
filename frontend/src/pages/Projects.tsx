import { useState, useEffect, useRef } from 'react'
import {
  Plus, FolderKanban, MapPin, Search, Users, DollarSign,
  Calendar, ChevronRight, Download, TrendingUp, MoreVertical,
  Archive, Pencil, X, BarChart2, CheckCircle2, PauseCircle, Clock, Building2
} from 'lucide-react'
import { projectService, type Project } from '../services/projectService'
import { exportProjectExcel } from '../utils/exportExcel'
import Button from '../components/ui/Button'

// ─── Types ─────────────────────────────────────────────────────────────────
type Payment = {
  id: string
  date: string
  amount: number
  concept: string
  method: string
  notes?: string
  workerName?: string | null
  companyName?: string | null
}

type TeamMember = {
  id: string
  name: string
  role: string
  position?: string
  value?: number
  paymentType?: string
  payments?: Payment[]
}

type ContractedCompany = {
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

type ProjectDetail = Project & {
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

// ─── Status config ──────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-50 text-green-700 border-green-100',
  completed: 'bg-blue-50 text-blue-700 border-blue-100',
  paused:    'bg-yellow-50 text-yellow-700 border-yellow-100',
  archived:  'bg-gray-50 text-gray-500 border-gray-200',
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  active:    <CheckCircle2 size={12} />,
  completed: <CheckCircle2 size={12} />,
  paused:    <PauseCircle size={12} />,
  archived:  <Archive size={12} />,
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Active', paused: 'Paused', completed: 'Completed', archived: 'Archived'
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n?: number | null) =>
  (n !== undefined && n !== null) ? '$' + n.toLocaleString('en-US') : '—'

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

const progressColor = (p: number) => {
  if (p >= 80) return 'bg-green-500'
  if (p >= 40) return 'bg-blue-500'
  return 'bg-yellow-400'
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub }: {
  icon: React.ReactNode; label: string; value: string; sub?: string
}) {
  return (
    <div
      className="rounded-xl border border-slate-700/50 px-5 py-4 flex items-center gap-4"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #1e3a5f 100%)' }}
    >
      <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-blue-300 shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-blue-300/80 font-medium">{label}</p>
        <p className="text-lg font-bold text-white leading-tight">{value}</p>
        {sub && <p className="text-xs text-blue-400/70">{sub}</p>}
      </div>
    </div>
  )
}

function ProjectCard({
  project, onClick, onStatusChange
}: {
  project: Project
  onClick: () => void
  onStatusChange: (id: string, status: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const prog = (project as any).progress ?? 0
  const budget = (project as any).budget
  const spent = (project as any).spent
  const client = (project as any).client
  const startDate = (project as any).startDate
  const endDate = (project as any).endDate
  const team: TeamMember[] = (project as any).team ?? []

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col"
      onClick={onClick}
    >
      {/* Card header */}
      <div className="p-5 flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
            <FolderKanban size={17} className="text-blue-600" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900 truncate">{project.name}</h3>
            {client && <p className="text-xs text-gray-400 mt-0.5 truncate">{client}</p>}
            {project.location && (
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <MapPin size={10} /> {project.location}
              </p>
            )}
          </div>
        </div>

        {/* Menu + badge */}
        <div className="flex items-center gap-1.5 ml-2 shrink-0" onClick={e => e.stopPropagation()}>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 capitalize ${STATUS_COLORS[project.status] ?? STATUS_COLORS.active}`}>
            {STATUS_ICON[project.status]}
            {STATUS_LABELS[project.status] ?? project.status}
          </span>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
            >
              <MoreVertical size={14} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-40">
                {['active', 'paused', 'completed', 'archived']
                  .filter(s => s !== project.status)
                  .map(s => (
                    <button
                      key={s}
                      onClick={() => { onStatusChange(project.id, s); setMenuOpen(false) }}
                      className="w-full text-left px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 capitalize flex items-center gap-2"
                    >
                      {STATUS_ICON[s]} Mark as {STATUS_LABELS[s]}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {prog > 0 && (
        <div className="px-5 mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-400">Progress</span>
            <span className="text-xs font-semibold text-gray-700">{prog}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressColor(prog)}`}
              style={{ width: `${prog}%` }}
            />
          </div>
        </div>
      )}

      {/* Budget row */}
      {(budget || spent) && (
        <div className="px-5 mb-3 flex items-center gap-4">
          {budget && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Budget</p>
              <p className="text-xs font-semibold text-gray-700">{fmt(budget)}</p>
            </div>
          )}
          {spent !== undefined && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Spent</p>
              <p className="text-xs font-semibold text-gray-700">{fmt(spent)}</p>
            </div>
          )}
          {budget && spent !== undefined && (
            <div className="ml-auto">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Remaining</p>
              <p className={`text-xs font-semibold ${budget - spent < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {fmt(budget - spent)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto px-5 py-3 border-t border-gray-100 flex items-center justify-between">
        {/* Team avatars */}
        <div className="flex items-center">
          {team.slice(0, 4).map((m, i) => (
            <div
              key={m.id}
              title={m.name}
              style={{ marginLeft: i > 0 ? '-8px' : 0, zIndex: team.length - i }}
              className="w-6 h-6 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white text-[10px] font-bold relative"
            >
              {m.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {team.length > 4 && (
            <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-500 text-[10px] font-bold -ml-2">
              +{team.length - 4}
            </div>
          )}
          {team.length === 0 && (
            <span className="text-xs text-gray-300 flex items-center gap-1"><Users size={11}/> No team</span>
          )}
        </div>

        {/* Dates */}
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Calendar size={11} />
          {startDate ? fmtDate(startDate) : fmtDate(project.createdAt)}
          {endDate && <> – {fmtDate(endDate)}</>}
        </div>

        <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
      </div>
    </div>
  )
}

// ─── Detail Modal ────────────────────────────────────────────────────────────
function ProjectDetailModal({ project, onClose, onExport, onEdit }: {
  project: ProjectDetail
  onClose: () => void
  onExport: (p: ProjectDetail) => void
  onEdit: () => void
}) {
  const [tab, setTab] = useState<'overview' | 'companies' | 'team' | 'payments'>('overview')
  const prog = project.progress ?? 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">

        {/* Modal header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
              <FolderKanban size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{project.name}</h2>
              {(project.companies ?? []).length > 0 && <p className="text-sm text-gray-400">{(project.companies ?? []).map(c => c.name).join(", ")}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex items-center gap-1 capitalize ${STATUS_COLORS[project.status] ?? STATUS_COLORS.active}`}>
              {STATUS_ICON[project.status]} {STATUS_LABELS[project.status] ?? project.status}
            </span>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 px-6 border-b border-gray-100">
          {(['overview', 'companies', 'team', 'payments'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium capitalize border-b-2 transition-colors -mb-px ${
                tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6">

          {tab === 'overview' && (
            <div className="space-y-5">
              {project.description && (
                <p className="text-sm text-gray-600 leading-relaxed">{project.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Start Date</p>
                  <p className="text-sm font-semibold text-gray-800">{fmtDate(project.startDate)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">End Date</p>
                  <p className="text-sm font-semibold text-gray-800">{fmtDate(project.endDate)}</p>
                </div>
                {project.location && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Location</p>
                    <p className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                      <MapPin size={12} /> {project.location}
                    </p>
                  </div>
                )}
                {project.clientContact && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Contact</p>
                    <p className="text-sm font-semibold text-gray-800">{project.clientContact}</p>
                  </div>
                )}
              </div>

              {/* Budget */}
              {project.budget !== undefined && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Budget Overview</p>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-400">Total Budget</p>
                      <p className="text-sm font-bold text-gray-900">{fmt(project.budget)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Spent</p>
                      <p className="text-sm font-bold text-gray-900">{fmt(project.spent)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Remaining</p>
                      <p className={`text-sm font-bold ${(project.budget ?? 0- (project.spent ?? 0)) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {fmt(project.budget ?? 0 - (project.spent ?? 0))}
                      </p>
                    </div>
                  </div>
                  {prog > 0 && (
                    <>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Progress</span><span className="font-semibold text-gray-700">{prog}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${progressColor(prog)}`} style={{ width: `${prog}%` }} />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === 'companies' && (
            <div className="space-y-3">
              {(project.companies ?? []).length === 0 ? (
                <div className="text-center py-10 text-sm text-gray-400">
                  <Building2 size={28} className="mx-auto text-gray-200 mb-2" />
                  No subcontractors assigned
                </div>
              ) : (
                (project.companies ?? []).map(c => (
                  <div key={c.contractId} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <Building2 size={15} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{c.name}</p>
                          <p className="text-xs text-gray-400">EIN: {c.ein ?? '—'}{c.contactPerson ? ` · ${c.contactPerson}` : ''}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Contract Value</p>
                        <p className="text-sm font-bold text-gray-900">{fmt(c.value)}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 mb-3 text-xs text-gray-400">
                      <span>{fmtDate(c.startDate)} – {fmtDate(c.endDate)}</span>
                      <span className="capitalize">{c.paymentType}</span>
                    </div>
                    {(c.payments ?? []).length > 0 ? (
                      <div className="space-y-1 border-t border-gray-100 pt-2">
                        <p className="text-xs font-semibold text-gray-500 mb-1">Payments</p>
                        {(c.payments ?? []).map(pay => (
                          <div key={pay.id} className="flex justify-between text-xs py-1">
                            <span className="text-gray-600">{pay.concept} · {fmtDate(pay.date)}</span>
                            <span className="font-semibold text-gray-800">{fmt(pay.amount)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-xs pt-1 border-t border-gray-100">
                          <span className="font-semibold text-gray-500">Total paid</span>
                          <span className="font-bold text-blue-600">{fmt((c.payments ?? []).reduce((s, p) => s + p.amount, 0))}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-300 border-t border-gray-100 pt-2">No payments yet</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'team' && (
            <div className="space-y-2">
              {(project.team ?? []).length === 0 ? (
                <div className="text-center py-10 text-sm text-gray-400">
                  <Users size={28} className="mx-auto text-gray-200 mb-2" />
                  No individual workers assigned
                </div>
              ) : (
                (project.team ?? []).map(m => (
                  <div key={m.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{m.name}</p>
                          <p className="text-xs text-gray-400">{m.role}{m.position ? ` · ${m.position}` : ''}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Contract Value</p>
                        <p className="text-sm font-bold text-gray-900">{fmt(m.value)}</p>
                      </div>
                    </div>
                    {(m.payments ?? []).length > 0 ? (
                      <div className="space-y-1 border-t border-gray-100 pt-2">
                        <p className="text-xs font-semibold text-gray-500 mb-1">Payments</p>
                        {(m.payments ?? []).map(pay => (
                          <div key={pay.id} className="flex justify-between text-xs py-1">
                            <span className="text-gray-600">{pay.concept} · {fmtDate(pay.date)}</span>
                            <span className="font-semibold text-gray-800">{fmt(pay.amount)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-xs pt-1 border-t border-gray-100">
                          <span className="font-semibold text-gray-500">Total paid</span>
                          <span className="font-bold text-blue-600">{fmt((m.payments ?? []).reduce((s, p) => s + p.amount, 0))}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-300 border-t border-gray-100 pt-2">No payments yet</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'payments' && (
            <div className="space-y-2">
              {(project.payments ?? []).length === 0 ? (
                <div className="text-center py-10 text-sm text-gray-400">
                  <DollarSign size={28} className="mx-auto text-gray-200 mb-2" />
                  No payments registered
                </div>
              ) : (
                <>
                  <div className="bg-blue-50 rounded-lg px-4 py-3 flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-blue-700">Total paid</span>
                    <span className="text-sm font-bold text-blue-800">
                      {fmt((project.payments ?? []).reduce((s, p) => s + p.amount, 0))}
                    </span>
                  </div>
                  {(project.payments ?? []).map(pay => (
                    <div key={pay.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{pay.concept}</p>
                        <p className="text-xs text-gray-400">{fmtDate(pay.date)} · {pay.method}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900">{fmt(pay.amount)}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <p className="text-xs text-gray-400">
            Created {fmtDate(project.createdAt)}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onEdit}>
              <Pencil size={14} /> Edit Project
            </Button>
            <Button variant="secondary" onClick={() => onExport(project)}>
              <Download size={14} /> Export Excel
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── New Project Form ────────────────────────────────────────────────────────
function NewProjectForm({ onSave, onCancel }: {
  onSave: (data: any) => Promise<void>
  onCancel: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', description: '', client: '', clientContact: '',
    location: '', startDate: '', endDate: '',
    budget: '', status: 'active',
  })

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Project name is required'); return }
    setSaving(true)
    try {
      await onSave({
        ...form,
        budget: form.budget ? parseFloat(form.budget) : undefined,
      })
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error creating project')
      setSaving(false)
    }
  }

  const field = (label: string, key: string, opts?: {
    placeholder?: string; type?: string; required?: boolean
  }) => (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
        {label} {opts?.required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={opts?.type ?? 'text'}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={opts?.placeholder ?? ''}
        value={(form as any)[key]}
        onChange={e => { set(key, e.target.value); setError('') }}
      />
    </div>
  )

  return (
    <div className="bg-white rounded-xl border border-blue-200 p-5 mb-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-800">New Project</h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        {field('Project Name', 'name', { placeholder: "McDonald's #245", required: true })}
        {field('Client', 'client', { placeholder: 'Acme Corp' })}
      </div>
      <div className="mb-3">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Description</label>
        <textarea
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={2}
          placeholder="Brief project description..."
          value={form.description}
          onChange={e => set('description', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        {field('Location', 'location', { placeholder: 'Miami, FL' })}
        {field('Client Contact', 'clientContact', { placeholder: 'John Smith' })}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Status</label>
          <select
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={form.status}
            onChange={e => set('status', e.target.value)}
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {field('Start Date', 'startDate', { type: 'date' })}
        {field('End Date', 'endDate', { type: 'date' })}
        {field('Budget (USD)', 'budget', { placeholder: '50000', type: 'number' })}
      </div>

      {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

      <div className="flex gap-2 mt-4">
        <Button onClick={handleSave} loading={saving}>
          Save Project
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}



// ─── Edit Project Modal ───────────────────────────────────────────────────────
function EditProjectModal({ project, onClose, onSaved }: {
  project: ProjectDetail
  onClose: () => void
  onSaved: (updated: ProjectDetail) => void
}) {
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const [form, setForm] = useState({
    name:          project.name          || '',
    description:   project.description  || '',
    clientContact: project.clientContact || '',
    location:      project.location      || '',
    status:        project.status        || 'active',
    startDate:     project.startDate     ? project.startDate.slice(0, 10) : '',
    endDate:       project.endDate       ? project.endDate.slice(0, 10)   : '',
    budget:        project.budget != null ? String(project.budget)        : '',
  })

  const set = (k: string, v: string) => { setForm(p => ({ ...p, [k]: v })); setError('') }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Project name is required'); return }
    setSaving(true)
    try {
      const payload: any = {
        name:          form.name,
        description:   form.description   || undefined,
        clientContact: form.clientContact  || undefined,
        location:      form.location       || undefined,
        status:        form.status,
        startDate:     form.startDate      || undefined,
        endDate:       form.endDate        || undefined,
        budget:        form.budget ? parseFloat(form.budget) : undefined,
      }
      await projectService.update(project.id, payload)
      onSaved({ ...project, ...payload })
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error updating project')
      setSaving(false)
    }
  }

  const field = (label: string, key: string, opts?: { placeholder?: string; type?: string; required?: boolean }) => (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
        {label} {opts?.required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={opts?.type ?? 'text'}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={opts?.placeholder ?? ''}
        value={(form as any)[key]}
        onChange={e => set(key, e.target.value)}
      />
    </div>
  )

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <FolderKanban size={16} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Edit Project</h2>
              <p className="text-xs text-gray-400">{project.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              {field('Project Name', 'name', { placeholder: "McDonald's #245", required: true })}
            </div>
            {field('Client Contact', 'clientContact', { placeholder: 'John Smith' })}
            {field('Location', 'location', { placeholder: 'Miami, FL' })}
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Description</label>
              <textarea
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                placeholder="Brief project description..."
                value={form.description}
                onChange={e => set('description', e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Status</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={form.status}
                onChange={e => set('status', e.target.value)}
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            {field('Start Date', 'startDate', { type: 'date' })}
            {field('End Date',   'endDate',   { type: 'date' })}
            <div className="col-span-2">
              {field('Budget (USD)', 'budget', { placeholder: '50000', type: 'number' })}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>
            <Pencil size={14} /> Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Analytics ───────────────────────────────────────────────────────────────
function AnalyticsView({ projects }: { projects: Project[] }) {
  const completed = projects.filter(p => p.status === 'completed' && p.budget != null)

  if (completed.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
        <BarChart2 size={32} className="mx-auto text-gray-300 mb-2" />
        <p className="text-sm text-gray-400">No completed projects with budget data yet</p>
        <p className="text-xs text-gray-300 mt-1">Mark projects as Completed to see analytics</p>
      </div>
    )
  }

  const withMetrics = completed.map(p => {
    const budget = p.budget ?? 0
    const spent  = p.spent  ?? 0
    const profit = budget - spent
    const margin = budget > 0 ? Math.round((profit / budget) * 100) : 0
    return { ...p, budget, spent, profit, margin }
  })

  const byProfit = [...withMetrics].sort((a, b) => b.profit - a.profit)
  const byMargin = [...withMetrics].sort((a, b) => b.margin - a.margin)

  const totalBudget = withMetrics.reduce((s, p) => s + p.budget, 0)
  const totalSpent  = withMetrics.reduce((s, p) => s + p.spent,  0)
  const totalProfit = totalBudget - totalSpent
  const avgMargin   = withMetrics.length > 0
    ? Math.round(withMetrics.reduce((s, p) => s + p.margin, 0) / withMetrics.length)
    : 0

  const medal       = (i: number) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`
  const marginColor = (m: number) => m >= 20 ? 'text-green-600' : m >= 0 ? 'text-yellow-600' : 'text-red-600'
  const marginBg    = (m: number) => m >= 20 ? 'bg-green-500' : m >= 0 ? 'bg-yellow-400' : 'bg-red-400'

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-gray-400 font-medium">Completed Projects</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{completed.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-gray-400 font-medium">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(totalBudget)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-gray-400 font-medium">Total Profit</p>
          <p className={`text-2xl font-bold mt-1 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {fmt(totalProfit)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-gray-400 font-medium">Avg Margin</p>
          <p className={`text-2xl font-bold mt-1 ${marginColor(avgMargin)}`}>{avgMargin}%</p>
        </div>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            🏆 Ranking por Utilidad
          </p>
          <div className="space-y-3">
            {byProfit.map((p, i) => (
              <div key={p.id} className={`rounded-lg px-4 py-3 flex items-center justify-between ${
                i === 0 ? 'bg-yellow-50 border border-yellow-100' :
                i === 1 ? 'bg-gray-50 border border-gray-100' :
                i === 2 ? 'bg-orange-50 border border-orange-100' :
                'bg-white border border-gray-100'
              }`}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg shrink-0">{medal(i)}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                    <p className={`text-xs font-bold mt-0.5 ${p.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {p.profit >= 0 ? '+' : ''}{fmt(p.profit)}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-xs text-gray-400">Budget</p>
                  <p className="text-xs font-semibold text-gray-600">{fmt(p.budget)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            🎯 Ranking por Margen %
          </p>
          <div className="space-y-4">
            {byMargin.map((p, i) => (
              <div key={p.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm shrink-0">{medal(i)}</span>
                    <span className="text-sm font-medium text-gray-700 truncate">{p.name}</span>
                  </div>
                  <span className={`text-sm font-bold ml-3 shrink-0 ${marginColor(p.margin)}`}>
                    {p.margin}%
                  </span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${marginBg(p.margin)}`}
                    style={{ width: `${Math.max(0, Math.min(100, p.margin))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
          💰 Costos por Proyecto
        </p>
        <div className="space-y-4">
          {withMetrics.sort((a, b) => b.budget - a.budget).map(p => (
            <div key={p.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 truncate max-w-[220px]">{p.name}</span>
                <div className="flex items-center gap-5 text-xs shrink-0 ml-4">
                  <span className="text-gray-400">Budget <span className="font-semibold text-gray-700">{fmt(p.budget)}</span></span>
                  <span className="text-gray-400">Spent <span className="font-semibold text-gray-700">{fmt(p.spent)}</span></span>
                  <span className={`font-bold ${p.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {p.profit >= 0 ? '+' : ''}{fmt(p.profit)}
                  </span>
                </div>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-blue-400 transition-all duration-500"
                  style={{ width: `${p.budget > 0 ? Math.min(100, (p.spent / p.budget) * 100) : 0}%` }} />
                <div className="h-full bg-green-400 transition-all duration-500"
                  style={{ width: `${p.budget > 0 ? Math.max(0, ((p.budget - p.spent) / p.budget) * 100) : 0}%` }} />
              </div>
              <div className="flex gap-4 mt-1">
                <span className="text-[10px] text-blue-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Spent
                </span>
                <span className="text-[10px] text-green-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Remaining
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'projects' | 'analytics'>('projects')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<ProjectDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectDetail | null>(null)

  useEffect(() => {
    projectService.getAll().then(p => { setProjects(p); setLoading(false) })
  }, [])

  const filtered = projects.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      ((p as any).client || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.location || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || p.status === filter
    return matchSearch && matchFilter
  })

  // Stats
  const active    = projects.filter(p => p.status === 'active').length
  const completed = projects.filter(p => p.status === 'completed').length
  const totalBudget = projects.reduce((s, p) => s + ((p as any).budget ?? 0), 0)

  const handleCreate = async (data: any) => {
    const newProject = await projectService.create(data)
    setProjects(p => [newProject, ...p])
    setShowForm(false)
  }

  const handleStatusChange = async (id: string, status: string) => {
    await projectService.update(id, { status })
    setProjects(p => p.map(pr => pr.id === id ? { ...pr, status } : pr))
    if (selected?.id === id) setSelected(s => s ? { ...s, status } : s)
  }

  const handleCardClick = async (project: Project) => {
    setLoadingDetail(true)
    try {
      const detail = await projectService.getById(project.id)
      setSelected(detail as ProjectDetail)
    } catch {
      setSelected(project as ProjectDetail)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleExport = (project: ProjectDetail) => {
    exportProjectExcel(project)
  }

  const handleProjectSaved = (updated: ProjectDetail) => {
    setProjects(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p))
    setSelected(updated)
    setEditingProject(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">{projects.length} projects total</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('projects')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                view === 'projects' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FolderKanban size={13} /> Projects
            </button>
            <button
              onClick={() => setView('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                view === 'analytics' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart2 size={13} /> Analytics
            </button>
          </div>
          {view === 'projects' && (
            <Button onClick={() => setShowForm(v => !v)}>
              <Plus size={15} /> New Project
            </Button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard icon={<FolderKanban size={18} />} label="Total Projects" value={String(projects.length)} />
        <StatCard icon={<CheckCircle2 size={18} />} label="Active" value={String(active)} sub={`${completed} completed`} />
        <StatCard icon={<Clock size={18} />} label="Paused" value={String(projects.filter(p => p.status === 'paused').length)} />
        <StatCard icon={<TrendingUp size={18} />} label="Total Budget" value={fmt(totalBudget)} />
      </div>

      {view === 'analytics' ? (
        <AnalyticsView projects={projects} />
      ) : (
      <>
      {/* New project form */}
      {showForm && (
        <NewProjectForm
          onSave={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Search + filter */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by name, client or location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['all', 'active', 'paused', 'completed', 'archived'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                filter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s === 'all' ? 'All' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-16 text-sm text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
          <FolderKanban size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">
            {search || filter !== 'all' ? 'No projects match your filters' : 'No projects yet'}
          </p>
          {!search && filter === 'all' && (
            <button onClick={() => setShowForm(true)} className="mt-3 text-sm text-blue-600 hover:underline">
              Create first project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(p => (
            <ProjectCard
              key={p.id}
              project={p}
              onClick={() => handleCardClick(p)}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      </>
      )}

      {/* Loading overlay for detail */}
      {loadingDetail && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-xl p-6 shadow-xl text-sm text-gray-500">Loading project...</div>
        </div>
      )}

      {/* Edit project modal */}
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSaved={handleProjectSaved}
        />
      )}

      {/* Detail modal */}
      {selected && (
        <ProjectDetailModal
          project={selected}
          onClose={() => setSelected(null)}
          onExport={handleExport}
          onEdit={() => setEditingProject(selected)}
        />
      )}
    </div>
  )
}