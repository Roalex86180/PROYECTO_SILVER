import { useState, useEffect } from 'react'
import { X, Building2, Users, Search, Check, Trash2 } from 'lucide-react'
import { companyService, type Company } from '../../../services/companyService'
import { workerService, type Worker } from '../../../services/workerService'
import { routeService } from '../../../services/routeService'
import { localService } from '../../../services/localService'
import Button from '../../../components/ui/Button'

interface AssignedCompany { company: { id: string; name: string; ein?: string } }
interface AssignedWorker { worker: { id: string; name: string; role: string } }

interface Props {
    type: 'route' | 'local'
    id: string
    name: string
    assignedCompanies: AssignedCompany[]
    assignedWorkers: AssignedWorker[]
    onClose: () => void
    onUpdated: (companies: AssignedCompany[], workers: AssignedWorker[]) => void
}

export default function AssignModal({
    type, id, name, assignedCompanies, assignedWorkers, onClose, onUpdated
}: Props) {
    const [tab, setTab] = useState<'companies' | 'workers'>('companies')
    const [companies, setCompanies] = useState<Company[]>([])
    const [workers, setWorkers] = useState<Worker[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [currentCompanies, setCurrentCompanies] = useState<AssignedCompany[]>(assignedCompanies)
    const [currentWorkers, setCurrentWorkers] = useState<AssignedWorker[]>(assignedWorkers)
    const [saving, setSaving] = useState<string | null>(null)

    useEffect(() => {
        Promise.all([companyService.getAll(), workerService.getAll()])
            .then(([c, w]) => { setCompanies(c); setWorkers(w) })
            .finally(() => setLoading(false))
    }, [])

    const isCompanyAssigned = (companyId: string) =>
        currentCompanies.some(c => c.company.id === companyId)

    const isWorkerAssigned = (workerId: string) =>
        currentWorkers.some(w => w.worker.id === workerId)

    const handleToggleCompany = async (company: Company) => {
        setSaving(company.id)
        try {
            if (isCompanyAssigned(company.id)) {
                if (type === 'route') {
                    await routeService.removeCompany(id, company.id)
                } else {
                    // local companies use same pattern
                    await localService.removeCompany(id, company.id)
                }
                const updated = currentCompanies.filter(c => c.company.id !== company.id)
                setCurrentCompanies(updated)
                onUpdated(updated, currentWorkers)
            } else {
                if (type === 'route') {
                    await routeService.assignCompany(id, company.id)
                } else {
                    await localService.assignCompany(id, company.id)
                }
                const updated = [...currentCompanies, { company: { id: company.id, name: company.name, ein: company.ein } }]
                setCurrentCompanies(updated)
                onUpdated(updated, currentWorkers)
            }
        } finally {
            setSaving(null)
        }
    }

    const handleToggleWorker = async (worker: Worker) => {
        setSaving(worker.id)
        try {
            if (isWorkerAssigned(worker.id)) {
                if (type === 'route') {
                    await routeService.removeWorker(id, worker.id)
                } else {
                    await localService.removeWorker(id, worker.id)
                }
                const updated = currentWorkers.filter(w => w.worker.id !== worker.id)
                setCurrentWorkers(updated)
                onUpdated(currentCompanies, updated)
            } else {
                if (type === 'route') {
                    await routeService.assignWorker(id, worker.id)
                } else {
                    await localService.assignWorker(id, worker.id)
                }
                const updated = [...currentWorkers, { worker: { id: worker.id, name: worker.name, role: worker.role } }]
                setCurrentWorkers(updated)
                onUpdated(currentCompanies, updated)
            }
        } finally {
            setSaving(null)
        }
    }

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.ein.toLowerCase().includes(search.toLowerCase())
    )

    const filteredWorkers = workers.filter(w =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.role.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center md:p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-lg flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-sm font-bold text-gray-900">
                            Assign to {type === 'route' ? 'Route' : 'Local'}
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">{name}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-4 border-b border-gray-100">
                    <button
                        onClick={() => { setTab('companies'); setSearch('') }}
                        className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === 'companies' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>
                        <Building2 size={14} /> Companies
                        {currentCompanies.length > 0 && (
                            <span className="bg-blue-100 text-blue-600 text-xs px-1.5 py-0.5 rounded-full">
                                {currentCompanies.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => { setTab('workers'); setSearch('') }}
                        className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === 'workers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>
                        <Users size={14} /> Workers
                        {currentWorkers.length > 0 && (
                            <span className="bg-blue-100 text-blue-600 text-xs px-1.5 py-0.5 rounded-full">
                                {currentWorkers.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 pb-2">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={tab === 'companies' ? 'Search company or EIN...' : 'Search worker or role...'}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                    {loading ? (
                        <p className="text-center text-sm text-gray-400 py-6">Loading...</p>
                    ) : tab === 'companies' ? (
                        filteredCompanies.length === 0 ? (
                            <p className="text-center text-sm text-gray-400 py-6">No companies found</p>
                        ) : filteredCompanies.map(company => {
                            const assigned = isCompanyAssigned(company.id)
                            const isSaving = saving === company.id
                            return (
                                <div
                                    key={company.id}
                                    onClick={() => !isSaving && handleToggleCompany(company)}
                                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${assigned ? 'border-blue-200 bg-blue-50' : 'border-gray-100 hover:border-blue-100 hover:bg-gray-50'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${assigned ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                            <Building2 size={14} className={assigned ? 'text-blue-600' : 'text-gray-400'} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">{company.name}</p>
                                            <p className="text-xs text-gray-400">EIN: {company.ein}</p>
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        {isSaving ? (
                                            <span className="text-xs text-gray-400">...</span>
                                        ) : assigned ? (
                                            <div className="flex items-center gap-1">
                                                <Check size={14} className="text-blue-600" />
                                                <Trash2 size={13} className="text-red-400" />
                                            </div>
                                        ) : (
                                            <span className="text-xs text-blue-500 font-medium">Assign</span>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        filteredWorkers.length === 0 ? (
                            <p className="text-center text-sm text-gray-400 py-6">No workers found</p>
                        ) : filteredWorkers.map(worker => {
                            const assigned = isWorkerAssigned(worker.id)
                            const isSaving = saving === worker.id
                            return (
                                <div
                                    key={worker.id}
                                    onClick={() => !isSaving && handleToggleWorker(worker)}
                                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${assigned ? 'border-blue-200 bg-blue-50' : 'border-gray-100 hover:border-blue-100 hover:bg-gray-50'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${assigned ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                            {worker.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">{worker.name}</p>
                                            <p className="text-xs text-gray-400">{worker.role}</p>
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        {isSaving ? (
                                            <span className="text-xs text-gray-400">...</span>
                                        ) : assigned ? (
                                            <div className="flex items-center gap-1">
                                                <Check size={14} className="text-blue-600" />
                                                <Trash2 size={13} className="text-red-400" />
                                            </div>
                                        ) : (
                                            <span className="text-xs text-blue-500 font-medium">Assign</span>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
                    <Button variant="secondary" onClick={onClose}>Done</Button>
                </div>
            </div>
        </div>
    )
}