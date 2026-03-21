import { useState, useEffect } from 'react'
import { FolderKanban, Users, DollarSign, Download, Pencil, X, Building2, CheckCircle2, PauseCircle, Archive, ChevronDown, ChevronRight, MapPin, Route } from 'lucide-react'
import { STATUS_COLORS, STATUS_LABELS, fmt, fmtDate, progressColor } from '../projectConstants'
import type { ProjectDetail } from '../projectTypes'
import Button from '../../../components/ui/Button'
import RoutesModal from './RoutesModal'
import { routeService } from '../../../services/routeService'
import { expenseService, type Expense } from '../../../services/expenseService'




const STATUS_ICON: Record<string, React.ReactNode> = {
    active: <CheckCircle2 size={12} />,
    completed: <CheckCircle2 size={12} />,
    paused: <PauseCircle size={12} />,
    archived: <Archive size={12} />,
}

function RouteSummary({ projectId }: { projectId: string }) {
    const [routes, setRoutes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState<string | null>(null)

    useEffect(() => {
        routeService.getByProject(projectId)
            .then(data => setRoutes(data.map((rt: any) => ({
                ...rt,
                locals: (rt.locals ?? []).map((l: any) => ({
                    ...l,
                    workers: l.workers ?? [],
                    companies: l.companies ?? []
                })),
                companies: rt.companies ?? [],
                workers: rt.workers ?? []
            }))))
            .finally(() => setLoading(false))
    }, [projectId])

    if (loading) return <p className="text-xs text-gray-400">Loading routes...</p>
    if (routes.length === 0) return (
        <p className="text-xs text-gray-400 text-center py-2">No routes yet</p>
    )

    return (
        <div className="space-y-2">
            {routes.map(route => (
                <div key={route.id} className="border border-gray-100 rounded-lg overflow-hidden">
                    <div
                        className="flex items-start justify-between px-3 py-2.5 bg-gray-100 cursor-pointer"
                        onClick={() => setExpanded(e => e === route.id ? null : route.id)}
                    >
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                            {expanded === route.id
                                ? <ChevronDown size={14} className="text-gray-400 mt-0.5 shrink-0" />
                                : <ChevronRight size={14} className="text-gray-400 mt-0.5 shrink-0" />}
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-xs font-semibold text-gray-800">{route.name}</p>
                                    <span className="text-xs text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded-full shrink-0">
                                        {route.locals.length} locals
                                    </span>
                                </div>
                                {/* Companies + Workers assigned to route */}
                                {(route.companies.length > 0 || route.workers.length > 0) && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {route.companies.map((c: any) => (
                                            <span key={c.company.id} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded-full">
                                                <Building2 size={9} /> {c.company.name}
                                            </span>
                                        ))}
                                        {route.workers.map((w: any) => (
                                            <span key={w.worker.id} className="flex items-center gap-1 text-xs bg-purple-50 text-purple-700 border border-purple-100 px-1.5 py-0.5 rounded-full">
                                                <Users size={9} /> {w.worker.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {expanded === route.id && (
                        <div className="divide-y divide-gray-50">
                            {route.locals.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-3">No locals</p>
                            ) : route.locals.map((local: any) => (
                                <div key={local.id} className="px-3 py-2.5">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-gray-800">{local.name}</p>
                                            <div className="flex flex-wrap gap-2 mt-0.5 text-xs text-gray-400">
                                                {local.location && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin size={9} /> {local.location}
                                                    </span>
                                                )}
                                                {local.address && (
                                                    <span>{local.address}{local.zipCode ? `, ${local.zipCode}` : ''}</span>
                                                )}
                                            </div>
                                            {/* Companies + Workers assigned to local */}
                                            {(local.companies.length > 0 || local.workers.length > 0) && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {local.companies.map((c: any) => (
                                                        <span key={c.company.id} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded-full">
                                                            <Building2 size={9} /> {c.company.name}
                                                        </span>
                                                    ))}
                                                    {local.workers.map((w: any) => (
                                                        <span key={w.worker.id} className="flex items-center gap-1 text-xs bg-purple-50 text-purple-700 border border-purple-100 px-1.5 py-0.5 rounded-full">
                                                            <Users size={9} /> {w.worker.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {local.budget && (
                                            <span className="text-xs font-semibold text-gray-700 shrink-0 ml-2">
                                                {fmt(local.budget)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

export default function ProjectDetailModal({ project, onClose, onExport, onEdit }: {
    project: ProjectDetail
    onClose: () => void
    onExport: (p: ProjectDetail, expenses?: any[]) => void
    onEdit: () => void
}) {
    const [tab, setTab] = useState<'overview' | 'companies' | 'team' | 'payments' | 'routes'>('overview')
    const [showRoutes, setShowRoutes] = useState(false)

    const [projectExpenses, setProjectExpenses] = useState<Expense[]>([])

    // useEffect para cargarlos
    useEffect(() => {
        expenseService.getAll({ projectId: project.id }).then(setProjectExpenses)
    }, [project.id])
    const prog = project.progress ?? 0

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-2xl flex flex-col max-h-[95vh] md:max-h-[90vh]">

                {/* Header */}
                <div className="flex items-start justify-between p-4 md:p-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                            <FolderKanban size={16} className="text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-900">{project.name}</h2>
                            {(project.companies ?? []).length > 0 && (
                                <p className="text-xs text-gray-400 truncate max-w-[200px] md:max-w-none">
                                    {(project.companies ?? []).map(c => c.name).join(', ')}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 capitalize ${STATUS_COLORS[project.status] ?? STATUS_COLORS.active}`}>
                            {STATUS_ICON[project.status]} {STATUS_LABELS[project.status] ?? project.status}
                        </span>
                        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                            <X size={15} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-0 px-4 border-b border-gray-100 overflow-x-auto">
                    {(['overview', 'companies', 'team', 'payments', 'routes'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-3 py-2.5 text-xs font-medium capitalize border-b-2 transition-colors -mb-px shrink-0 ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>
                            {t}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 md:p-5">

                    {tab === 'overview' && (
                        <div className="space-y-3">
                            {project.description && (
                                <p className="text-xs text-gray-500 leading-relaxed">{project.description}</p>
                            )}

                            {/* Dates — compact */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-gray-50 rounded-lg px-3 py-2">
                                    <p className="text-xs text-gray-400 mb-0.5">Start Date</p>
                                    <p className="text-xs font-semibold text-gray-800">{fmtDate(project.startDate)}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg px-3 py-2">
                                    <p className="text-xs text-gray-400 mb-0.5">End Date</p>
                                    <p className="text-xs font-semibold text-gray-800">{fmtDate(project.endDate)}</p>
                                </div>
                            </div>

                            {/* Contact — inline badge */}
                            {project.clientContact && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">Contact</span>
                                    <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                                        {project.clientContact}
                                    </span>
                                </div>
                            )}

                            {/* Budget — compact */}
                            {project.budget !== undefined && (
                                <div className="bg-gray-50 rounded-lg px-3 py-2">
                                    <p className="text-xs text-gray-400 mb-2">Budget Overview</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <p className="text-xs text-gray-400">Total</p>
                                            <p className="text-xs font-bold text-gray-900">{fmt(project.budget)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Spent</p>
                                            <p className="text-xs font-bold text-gray-900">{fmt(project.spent)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Remaining</p>
                                            <p className={`text-xs font-bold ${(project.budget ?? 0 - (project.spent ?? 0)) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                {fmt(project.budget ?? 0 - (project.spent ?? 0))}
                                            </p>
                                        </div>
                                    </div>
                                    {prog > 0 && (
                                        <div className="mt-2">
                                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                <span>Progress</span>
                                                <span className="font-semibold text-gray-700">{prog}%</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${progressColor(prog)}`} style={{ width: `${prog}%` }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Routes — más espacio, sin recuadro extra */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Routes & Locals</p>
                                    <button
                                        onClick={() => setShowRoutes(true)}
                                        className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 transition-colors">
                                        <Route size={11} /> Manage
                                    </button>
                                </div>
                                <RouteSummary projectId={project.id} />
                            </div>
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
                                            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                                <Building2 size={15} className="text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{c.name}</p>
                                                <p className="text-xs text-gray-400">EIN: {c.ein ?? '—'}{c.contactPerson ? ` · ${c.contactPerson}` : ''}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 ml-2">
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
                                            {(c.payments ?? []).map((pay: any) => (
                                                <div key={pay.id} className="flex justify-between text-xs py-1">
                                                    <span className="text-gray-600">{pay.concept} · {fmtDate(pay.date)}</span>
                                                    <span className="font-semibold text-gray-800">{fmt(pay.amount)}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between text-xs pt-1 border-t border-gray-100">
                                                <span className="font-semibold text-gray-500">Total paid</span>
                                                <span className="font-bold text-blue-600">{fmt((c.payments ?? []).reduce((s: number, p: any) => s + p.amount, 0))}</span>
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
                                            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                                {m.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{m.name}</p>
                                                <p className="text-xs text-gray-400">{m.role}{m.position ? ` · ${m.position}` : ''}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 ml-2">
                                            <p className="text-xs text-gray-400">Contract Value</p>
                                            <p className="text-sm font-bold text-gray-900">{fmt(m.value)}</p>
                                        </div>
                                    </div>
                                    {(m.payments ?? []).length > 0 ? (
                                        <div className="space-y-1 border-t border-gray-100 pt-2">
                                            <p className="text-xs font-semibold text-gray-500 mb-1">Payments</p>
                                            {(m.payments ?? []).map((pay: any) => (
                                                <div key={pay.id} className="flex justify-between text-xs py-1">
                                                    <span className="text-gray-600">{pay.concept} · {fmtDate(pay.date)}</span>
                                                    <span className="font-semibold text-gray-800">{fmt(pay.amount)}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between text-xs pt-1 border-t border-gray-100">
                                                <span className="font-semibold text-gray-500">Total paid</span>
                                                <span className="font-bold text-blue-600">{fmt((m.payments ?? []).reduce((s: number, p: any) => s + p.amount, 0))}</span>
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
                                            <p className="text-sm font-bold text-gray-900 shrink-0 ml-2">{fmt(pay.amount)}</p>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    )}

                    {tab === 'routes' && (
                        <div className="text-center py-6">
                            <Route size={28} className="mx-auto text-gray-200 mb-2" />
                            <p className="text-sm text-gray-400 mb-3">Add and manage routes and locals for this project</p>
                            <Button onClick={() => setShowRoutes(true)}>
                                <Route size={14} /> Manage Routes
                            </Button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    <p className="text-xs text-gray-400">Created {fmtDate(project.createdAt)}</p>
                    <div className="flex gap-2 flex-wrap">
                        <Button variant="secondary" onClick={onEdit}><Pencil size={13} /> Edit</Button>
                        <Button variant="secondary" onClick={() => onExport(project, projectExpenses)}><Download size={13} /> Export</Button>
                        <Button variant="secondary" onClick={onClose}>Close</Button>
                    </div>
                </div>
            </div>

            {showRoutes && (
                <RoutesModal
                    projectId={project.id}
                    projectName={project.name}
                    onClose={() => setShowRoutes(false)}
                />
            )}
        </div>
    )
}