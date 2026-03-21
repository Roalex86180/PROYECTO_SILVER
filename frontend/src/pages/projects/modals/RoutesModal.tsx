import { useState, useEffect } from 'react'
import { X, Plus, ChevronDown, ChevronRight, MapPin, DollarSign, Trash2, Building2, Users, Pencil, UserPlus } from 'lucide-react'
import { routeService } from '../../../services/routeService'
import { localService } from '../../../services/localService'
import Button from '../../../components/ui/Button'
import AssignModal from './AssignModal'

const USA_STATES = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
    'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
    'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
    'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma',
    'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
    'West Virginia', 'Wisconsin', 'Wyoming'
]

interface LocalWorker { worker: { id: string; name: string; role: string } }
interface LocalCompany { company: { id: string; name: string; ein?: string } }
interface Local {
    id: string
    name: string
    budget?: number
    location?: string
    address?: string
    zipCode?: string
    workers: LocalWorker[]
    companies: LocalCompany[]
}
interface RouteCompany { company: { id: string; name: string; ein?: string } }
interface RouteWorker { worker: { id: string; name: string; role: string } }
interface Route {
    id: string
    name: string
    locals: Local[]
    companies: RouteCompany[]
    workers: RouteWorker[]
}

// ─── Edit Local Modal ─────────────────────────────────────────────────────────

function EditLocalModal({ local, onSave, onClose }: {
    local: Local
    onSave: (data: Partial<Local>) => Promise<void>
    onClose: () => void
}) {
    const [form, setForm] = useState({
        name: local.name,
        budget: local.budget ? String(local.budget) : '',
        location: local.location ?? '',
        address: local.address ?? '',
        zipCode: local.zipCode ?? '',
    })
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        if (!form.name.trim()) return
        setSaving(true)
        await onSave({
            name: form.name,
            budget: form.budget ? Number(form.budget) : undefined,
            location: form.location || undefined,
            address: form.address || undefined,
            zipCode: form.zipCode || undefined,
        })
        setSaving(false)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center md:p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-md">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900">Edit Local</h3>
                    <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
                        <X size={15} />
                    </button>
                </div>
                <div className="p-4 space-y-3">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Name *</label>
                        <input
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Budget (USD)</label>
                        <input
                            type="number"
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0"
                            value={form.budget}
                            onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">State</label>
                        <select
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            value={form.location}
                            onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                        >
                            <option value="">Select State</option>
                            {USA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Address</label>
                        <input
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="123 Main St"
                            value={form.address}
                            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Zip Code</label>
                        <input
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="33101"
                            value={form.zipCode}
                            onChange={e => setForm(f => ({ ...f, zipCode: e.target.value }))}
                        />
                    </div>
                </div>
                <div className="flex gap-2 justify-end p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ─── Edit Route Modal ─────────────────────────────────────────────────────────

function EditRouteModal({ route, onSave, onClose }: {
    route: Route
    onSave: (name: string) => Promise<void>
    onClose: () => void
}) {
    const [name, setName] = useState(route.name)
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        if (!name.trim()) return
        setSaving(true)
        await onSave(name.trim())
        setSaving(false)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center md:p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-sm">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900">Edit Route</h3>
                    <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
                        <X size={15} />
                    </button>
                </div>
                <div className="p-4">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Route Name *</label>
                    <input
                        autoFocus
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSave()}
                    />
                </div>
                <div className="flex gap-2 justify-end p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving || !name.trim()}>
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ─── Local Form (new) ─────────────────────────────────────────────────────────

function LocalForm({ routeId, onSaved, onCancel }: {
    routeId: string
    onSaved: (local: Local) => void
    onCancel: () => void
}) {
    const [form, setForm] = useState({ name: '', budget: '', location: '', address: '', zipCode: '' })
    const [saving, setSaving] = useState(false)

    const handleSubmit = async () => {
        if (!form.name.trim()) return
        setSaving(true)
        try {
            const local = await localService.create({
                name: form.name, routeId,
                budget: form.budget ? Number(form.budget) : undefined,
                location: form.location || undefined,
                address: form.address || undefined,
                zipCode: form.zipCode || undefined,
            })
            onSaved(local)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="border border-blue-100 rounded-xl p-4 bg-blue-50 space-y-3 mt-2">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">New Local</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="Local name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                <input className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="Budget (USD)" type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} />
                <select className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}>
                    <option value="">Select State</option>
                    {USA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                <input className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="Zip Code" value={form.zipCode} onChange={e => setForm(f => ({ ...f, zipCode: e.target.value }))} />
            </div>
            <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={saving || !form.name.trim()}>{saving ? 'Saving...' : 'Save Local'}</Button>
            </div>
        </div>
    )
}

// ─── Assigned badges ──────────────────────────────────────────────────────────

function AssignedBadges({ companies, workers }: { companies: any[], workers: any[] }) {
    if (companies.length === 0 && workers.length === 0) return null
    return (
        <div className="flex flex-wrap gap-1 mt-1.5">
            {companies.map((c: any) => (
                <span key={c.company.id} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">
                    <Building2 size={10} /> {c.company.name}
                </span>
            ))}
            {workers.map((w: any) => (
                <span key={w.worker.id} className="flex items-center gap-1 text-xs bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-full">
                    <Users size={10} /> {w.worker.name}
                </span>
            ))}
        </div>
    )
}

// ─── Route Card ───────────────────────────────────────────────────────────────

function RouteCard({ route, onDelete, onLocalAdded, onLocalDeleted, onRouteUpdated, onLocalUpdated }: {
    route: Route
    onDelete: (id: string) => void
    onLocalAdded: (routeId: string, local: Local) => void
    onLocalDeleted: (routeId: string, localId: string) => void
    onRouteUpdated: (routeId: string, data: Partial<Route>) => void
    onLocalUpdated: (routeId: string, localId: string, data: Partial<Local>) => void
}) {
    const [expanded, setExpanded] = useState(true)
    const [showLocalForm, setShowLocalForm] = useState(false)
    const [editingRoute, setEditingRoute] = useState(false)
    const [editingLocal, setEditingLocal] = useState<Local | null>(null)
    const [assignTarget, setAssignTarget] = useState<{ type: 'route' | 'local', id: string, name: string, companies: any[], workers: any[] } | null>(null)

    const locals = route.locals ?? []
    const companies = route.companies ?? []
    const workers = route.workers ?? []

    const handleDeleteLocal = async (localId: string) => {
        await localService.delete(localId)
        onLocalDeleted(route.id, localId)
    }

    const handleSaveRoute = async (name: string) => {
        await routeService.update(route.id, { name })
        onRouteUpdated(route.id, { name })
    }

    const handleSaveLocal = async (data: Partial<Local>) => {
        if (!editingLocal) return
        await localService.update(editingLocal.id, data)
        onLocalUpdated(route.id, editingLocal.id, data)
    }

    return (
        <>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
                {/* Route header */}
                <div className="flex items-center justify-between p-3 bg-gray-50">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <button onClick={() => setExpanded(v => !v)} className="shrink-0 text-gray-400">
                            {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        </button>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800">{route.name}</p>
                            <AssignedBadges companies={companies} workers={workers} />
                        </div>
                        <span className="text-xs text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full shrink-0">
                            {locals.length} locals
                        </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button onClick={() => setEditingRoute(true)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors" title="Edit route">
                            <Pencil size={13} />
                        </button>
                        <button onClick={() => setAssignTarget({ type: 'route', id: route.id, name: route.name, companies, workers })}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors" title="Assign">
                            <UserPlus size={13} />
                        </button>
                        <button onClick={() => onDelete(route.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 size={13} />
                        </button>
                    </div>
                </div>

                {/* Locals */}
                {expanded && (
                    <div className="p-3 space-y-2">
                        {locals.length === 0 && !showLocalForm && (
                            <p className="text-xs text-gray-400 text-center py-2">No locals yet</p>
                        )}
                        {locals.map(local => (
                            <div key={local.id} className="p-3 rounded-lg border border-gray-100 hover:border-blue-100 transition-colors">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800">{local.name}</p>
                                        <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-400">
                                            {local.budget && (
                                                <span className="flex items-center gap-1"><DollarSign size={10} />{local.budget}</span>
                                            )}
                                            {local.location && (
                                                <span className="flex items-center gap-1"><MapPin size={10} />{local.location}</span>
                                            )}
                                            {local.address && (
                                                <span>{local.address}{local.zipCode ? `, ${local.zipCode}` : ''}</span>
                                            )}
                                        </div>
                                        <AssignedBadges companies={local.companies ?? []} workers={local.workers ?? []} />
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button onClick={() => setEditingLocal(local)}
                                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors" title="Edit local">
                                            <Pencil size={13} />
                                        </button>
                                        <button onClick={() => setAssignTarget({ type: 'local', id: local.id, name: local.name, companies: local.companies ?? [], workers: local.workers ?? [] })}
                                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors" title="Assign">
                                            <UserPlus size={13} />
                                        </button>
                                        <button onClick={() => handleDeleteLocal(local.id)}
                                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {showLocalForm ? (
                            <LocalForm
                                routeId={route.id}
                                onSaved={local => { onLocalAdded(route.id, local); setShowLocalForm(false) }}
                                onCancel={() => setShowLocalForm(false)}
                            />
                        ) : (
                            <button onClick={() => setShowLocalForm(true)}
                                className="w-full mt-1 py-2 text-xs text-blue-500 border border-dashed border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-1">
                                <Plus size={13} /> Add Local
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Edit Route Modal */}
            {editingRoute && (
                <EditRouteModal
                    route={route}
                    onSave={handleSaveRoute}
                    onClose={() => setEditingRoute(false)}
                />
            )}

            {/* Edit Local Modal */}
            {editingLocal && (
                <EditLocalModal
                    local={editingLocal}
                    onSave={handleSaveLocal}
                    onClose={() => setEditingLocal(null)}
                />
            )}

            {/* Assign Modal */}
            {assignTarget && (
                <AssignModal
                    type={assignTarget.type}
                    id={assignTarget.id}
                    name={assignTarget.name}
                    assignedCompanies={assignTarget.companies}
                    assignedWorkers={assignTarget.workers}
                    onClose={() => setAssignTarget(null)}
                    onUpdated={(companies, workers) => {
                        if (assignTarget.type === 'route') {
                            onRouteUpdated(route.id, { companies, workers })
                        } else {
                            onLocalUpdated(route.id, assignTarget.id, { companies, workers } as any)
                        }
                        setAssignTarget(null)
                    }}
                />
            )}
        </>
    )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function RoutesModal({ projectId, projectName, onClose }: {
    projectId: string
    projectName: string
    onClose: () => void
}) {
    const [routes, setRoutes] = useState<Route[]>([])
    const [loading, setLoading] = useState(true)
    const [newRouteName, setNewRouteName] = useState('')
    const [showRouteInput, setShowRouteInput] = useState(false)
    const [saving, setSaving] = useState(false)

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

    const handleAddRoute = async () => {
        if (!newRouteName.trim()) return
        setSaving(true)
        try {
            const route = await routeService.create({ name: newRouteName, projectId })
            setRoutes(r => [...r, { ...route, locals: [], companies: [], workers: [] }])
            setNewRouteName('')
            setShowRouteInput(false)
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteRoute = async (routeId: string) => {
        await routeService.delete(routeId)
        setRoutes(r => r.filter(rt => rt.id !== routeId))
    }

    const handleLocalAdded = (routeId: string, local: Local) => {
        setRoutes(r => r.map(rt => rt.id === routeId
            ? { ...rt, locals: [...rt.locals, { ...local, workers: [], companies: [] }] }
            : rt
        ))
    }

    const handleLocalDeleted = (routeId: string, localId: string) => {
        setRoutes(r => r.map(rt => rt.id === routeId
            ? { ...rt, locals: rt.locals.filter(l => l.id !== localId) }
            : rt
        ))
    }

    const handleRouteUpdated = (routeId: string, data: Partial<Route>) => {
        setRoutes(r => r.map(rt => rt.id === routeId ? { ...rt, ...data } : rt))
    }

    const handleLocalUpdated = (routeId: string, localId: string, data: Partial<Local>) => {
        setRoutes(r => r.map(rt => rt.id === routeId
            ? { ...rt, locals: rt.locals.map(l => l.id === localId ? { ...l, ...data } : l) }
            : rt
        ))
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center md:p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-2xl flex flex-col max-h-[95vh] md:max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-sm font-bold text-gray-900">Routes & Locals</h2>
                        <p className="text-xs text-gray-400 mt-0.5">{projectName}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? (
                        <div className="text-center py-10 text-sm text-gray-400">Loading...</div>
                    ) : routes.length === 0 && !showRouteInput ? (
                        <div className="text-center py-10 text-sm text-gray-400">
                            <p className="mb-3">No routes yet</p>
                            <Button onClick={() => setShowRouteInput(true)}><Plus size={14} /> Add First Route</Button>
                        </div>
                    ) : (
                        <>
                            {routes.map(route => (
                                <RouteCard
                                    key={route.id}
                                    route={route}
                                    onDelete={handleDeleteRoute}
                                    onLocalAdded={handleLocalAdded}
                                    onLocalDeleted={handleLocalDeleted}
                                    onRouteUpdated={handleRouteUpdated}
                                    onLocalUpdated={handleLocalUpdated}
                                />
                            ))}
                            {showRouteInput ? (
                                <div className="flex gap-2 items-center p-3 border border-blue-100 rounded-xl bg-blue-50">
                                    <input autoFocus
                                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        placeholder="Route name (e.g. Route 1)"
                                        value={newRouteName}
                                        onChange={e => setNewRouteName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddRoute()}
                                    />
                                    <Button onClick={handleAddRoute} disabled={saving || !newRouteName.trim()}>{saving ? 'Saving...' : 'Add'}</Button>
                                    <Button variant="secondary" onClick={() => { setShowRouteInput(false); setNewRouteName('') }}>Cancel</Button>
                                </div>
                            ) : (
                                <button onClick={() => setShowRouteInput(true)}
                                    className="w-full py-3 text-sm text-blue-500 border border-dashed border-blue-200 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-1">
                                    <Plus size={15} /> Add Route
                                </button>
                            )}
                        </>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    )
}