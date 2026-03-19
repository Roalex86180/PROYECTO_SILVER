import { useState } from 'react'
import { FolderKanban, MapPin, Users, DollarSign, Download, Pencil, X, Building2, CheckCircle2, PauseCircle, Archive } from 'lucide-react'
import { STATUS_COLORS, STATUS_LABELS, fmt, fmtDate, progressColor } from '../projectConstants'
import type { ProjectDetail } from '../projectTypes'
import Button from '../../../components/ui/Button'

const STATUS_ICON: Record<string, React.ReactNode> = {
    active: <CheckCircle2 size={12} />,
    completed: <CheckCircle2 size={12} />,
    paused: <PauseCircle size={12} />,
    archived: <Archive size={12} />,
}

export default function ProjectDetailModal({ project, onClose, onExport, onEdit }: {
    project: ProjectDetail
    onClose: () => void
    onExport: (p: ProjectDetail) => void
    onEdit: () => void
}) {
    const [tab, setTab] = useState<'overview' | 'companies' | 'team' | 'payments'>('overview')
    const prog = project.progress ?? 0

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-2xl flex flex-col max-h-[95vh] md:max-h-[90vh]">

                {/* Header */}
                <div className="flex items-start justify-between p-4 md:p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                            <FolderKanban size={18} className="text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-sm md:text-base font-bold text-gray-900">{project.name}</h2>
                            {(project.companies ?? []).length > 0 && (
                                <p className="text-xs md:text-sm text-gray-400 truncate max-w-[200px] md:max-w-none">
                                    {(project.companies ?? []).map(c => c.name).join(', ')}
                                </p>
                            )}
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
                <div className="flex gap-0 px-4 md:px-6 border-b border-gray-100 overflow-x-auto">
                    {(['overview', 'companies', 'team', 'payments'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-3 md:px-4 py-3 text-sm font-medium capitalize border-b-2 transition-colors -mb-px shrink-0 ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>
                            {t}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6">

                    {tab === 'overview' && (
                        <div className="space-y-4">
                            {project.description && <p className="text-sm text-gray-600 leading-relaxed">{project.description}</p>}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Start Date</p>
                                    <p className="text-sm font-semibold text-gray-800">{fmtDate(project.startDate)}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">End Date</p>
                                    <p className="text-sm font-semibold text-gray-800">{fmtDate(project.endDate)}</p>
                                </div>
                                {project.location && (
                                    <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Location</p>
                                        <p className="text-sm font-semibold text-gray-800 flex items-center gap-1"><MapPin size={12} /> {project.location}</p>
                                    </div>
                                )}
                                {project.clientContact && (
                                    <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Contact</p>
                                        <p className="text-sm font-semibold text-gray-800">{project.clientContact}</p>
                                    </div>
                                )}
                            </div>
                            {project.budget !== undefined && (
                                <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Budget Overview</p>
                                    <div className="grid grid-cols-3 gap-2 md:gap-3 mb-3">
                                        <div><p className="text-xs text-gray-400">Total Budget</p><p className="text-sm font-bold text-gray-900">{fmt(project.budget)}</p></div>
                                        <div><p className="text-xs text-gray-400">Spent</p><p className="text-sm font-bold text-gray-900">{fmt(project.spent)}</p></div>
                                        <div>
                                            <p className="text-xs text-gray-400">Remaining</p>
                                            <p className={`text-sm font-bold ${(project.budget ?? 0 - (project.spent ?? 0)) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                {fmt(project.budget ?? 0 - (project.spent ?? 0))}
                                            </p>
                                        </div>
                                    </div>
                                    {prog > 0 && (
                                        <>
                                            <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Progress</span><span className="font-semibold text-gray-700">{prog}%</span></div>
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
                                    <Building2 size={28} className="mx-auto text-gray-200 mb-2" />No subcontractors assigned
                                </div>
                            ) : (project.companies ?? []).map(c => (
                                <div key={c.contractId} className="border border-gray-100 rounded-xl p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><Building2 size={15} className="text-blue-600" /></div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{c.name}</p>
                                                <p className="text-xs text-gray-400">EIN: {c.ein ?? '—'}{c.contactPerson ? ` · ${c.contactPerson}` : ''}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 ml-2"><p className="text-xs text-gray-400">Contract Value</p><p className="text-sm font-bold text-gray-900">{fmt(c.value)}</p></div>
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
                                    ) : <p className="text-xs text-gray-300 border-t border-gray-100 pt-2">No payments yet</p>}
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === 'team' && (
                        <div className="space-y-2">
                            {(project.team ?? []).length === 0 ? (
                                <div className="text-center py-10 text-sm text-gray-400">
                                    <Users size={28} className="mx-auto text-gray-200 mb-2" />No individual workers assigned
                                </div>
                            ) : (project.team ?? []).map(m => (
                                <div key={m.id} className="border border-gray-100 rounded-xl p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">{m.name.charAt(0).toUpperCase()}</div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{m.name}</p>
                                                <p className="text-xs text-gray-400">{m.role}{m.position ? ` · ${m.position}` : ''}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 ml-2"><p className="text-xs text-gray-400">Contract Value</p><p className="text-sm font-bold text-gray-900">{fmt(m.value)}</p></div>
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
                                    ) : <p className="text-xs text-gray-300 border-t border-gray-100 pt-2">No payments yet</p>}
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === 'payments' && (
                        <div className="space-y-2">
                            {(project.payments ?? []).length === 0 ? (
                                <div className="text-center py-10 text-sm text-gray-400">
                                    <DollarSign size={28} className="mx-auto text-gray-200 mb-2" />No payments registered
                                </div>
                            ) : (
                                <>
                                    <div className="bg-blue-50 rounded-lg px-4 py-3 flex items-center justify-between mb-3">
                                        <span className="text-xs font-medium text-blue-700">Total paid</span>
                                        <span className="text-sm font-bold text-blue-800">{fmt((project.payments ?? []).reduce((s, p) => s + p.amount, 0))}</span>
                                    </div>
                                    {(project.payments ?? []).map(pay => (
                                        <div key={pay.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">{pay.concept}</p>
                                                <p className="text-xs text-gray-400">{fmtDate(pay.date)} · {pay.method}</p>
                                            </div>
                                            <p className="text-sm font-bold text-gray-900 shrink-0 ml-2">{fmt(pay.amount)}</p>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    <p className="text-xs text-gray-400">Created {fmtDate(project.createdAt)}</p>
                    <div className="flex gap-2 flex-wrap">
                        <Button variant="secondary" onClick={onEdit}><Pencil size={14} /> Edit Project</Button>
                        <Button variant="secondary" onClick={() => onExport(project)}><Download size={14} /> Export Excel</Button>
                        <Button variant="secondary" onClick={onClose}>Close</Button>
                    </div>
                </div>

            </div>
        </div>
    )
}