import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FileText, CreditCard, Search, User, Building2, ChevronRight, Download, Pencil, X, ArrowLeft } from 'lucide-react'
import { workerService, type Worker } from '../services/workerService'
import { companyService, type Company } from '../services/companyService'
import { contractService } from '../services/contractService'
import ExportModal from '../components/ui/ExportModal'


import type { ContractFull, WorkerDetail } from './hr/hrTypes'
import EditContractModal from './hr/modals/EditContractModal'
import EditCompanyModal from './hr/modals/EditCompanyModal'
import EditWorkerModal from './hr/modals/EditWorkerModal'
import PaymentRow from './hr/components/PaymentRow'

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function HumanResources() {
  const navigate = useNavigate()
  const [workers, setWorkers] = useState<Worker[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [allContracts, setAllContracts] = useState<ContractFull[]>([])
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState<Worker[]>([])
  const [showSug, setShowSug] = useState(false)
  const [selected, setSelected] = useState<WorkerDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [tab, setTab] = useState<'workers' | 'companies' | 'contracts'>('workers')
  const [loading, setLoading] = useState(true)
  const [showExport, setShowExport] = useState(false)
  const [exportData, setExportData] = useState<WorkerDetail[]>([])
  const [exportCompanyData, setExportCompanyData] = useState<any[]>([])
  const [isPreparingExport, setIsPreparingExport] = useState(false)
  const [editingWorker, setEditingWorker] = useState<WorkerDetail | null>(null)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [editingContract, setEditingContract] = useState<ContractFull | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [companySearch, setCompanySearch] = useState('')
  const [receiptModal, setReceiptModal] = useState<string | null>(null)
  const [zoom, setZoom] = useState<number>(1)
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)
  const [mobileDetailType, setMobileDetailType] = useState<'worker' | 'company'>('worker')

  useEffect(() => {
    Promise.all([workerService.getAll(), companyService.getAll(), contractService.getAll()])
      .then(([w, c, k]) => { setWorkers(w); setCompanies(c); setAllContracts(k as ContractFull[]); setLoading(false) })
  }, [])

  useEffect(() => {
    if (search.length > 0) {
      setSuggestions(workers.filter(w => w.name.toLowerCase().includes(search.toLowerCase())))
      setShowSug(true)
    } else {
      setSuggestions([])
      setShowSug(false)
    }
  }, [search, workers])

  const selectWorker = async (w: Worker) => {
    setLoadingDetail(true)
    try { const detail = await workerService.getById(w.id); setSelected(detail as WorkerDetail) }
    catch { setSelected(w as WorkerDetail) }
    finally { setLoadingDetail(false); setMobileDetailOpen(true); setMobileDetailType('worker') }
  }

  const handleGlobalExport = async () => {
    setIsPreparingExport(true)
    try {
      const allDetails = await Promise.all(workers.map(w => workerService.getById(w.id)))
      setExportData(allDetails as WorkerDetail[])
      setExportCompanyData([])
      setShowExport(true)
    } catch (error) {
      console.error('Error preparing global export', error)
    } finally {
      setIsPreparingExport(false)
    }
  }

  const handleGlobalCompanyExport = () => {
    setExportCompanyData(companies.map(c => ({ ...c, contracts: allContracts.filter(ct => ct.companyId === c.id) })))
    setExportData([])
    setShowExport(true)
  }

  const handleWorkerSaved = (updated: Worker) => {
    setWorkers(prev => prev.map(w => w.id === updated.id ? updated : w))
    setSelected(prev => prev ? { ...prev, ...updated } : prev)
    setEditingWorker(null)
  }

  const handleCompanySaved = (updated: Company) => {
    setCompanies(prev => prev.map(c => c.id === updated.id ? updated : c))
    setEditingCompany(null)
  }

  const handleContractSaved = (updated: ContractFull) => {
    setAllContracts(prev => prev.map(c => c.id === updated.id ? updated : c))
    setSelected(prev => prev ? {
      ...prev,
      contracts: (prev.contracts || []).map(c => c.id === updated.id ? { ...c, ...updated, value: String(updated.value) } : c),
    } : prev)
    setEditingContract(null)
  }

  const displayedWorkers = search
    ? workers.filter(w => w.name.toLowerCase().includes(search.toLowerCase()))
    : workers

  const totalPaid = (contracts: WorkerDetail['contracts']) =>
    contracts.flatMap(c => c.payments).reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Human Resources</h1>
          <p className="text-sm text-gray-500 mt-0.5">{workers.length} workers · {companies.length} companies</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap sm:justify-end">
          <button disabled={isPreparingExport} onClick={handleGlobalExport}
            className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 transition-colors disabled:opacity-50 shrink-0">
            <Download size={13} /> {isPreparingExport ? 'Preparing...' : 'Export Workers'}
          </button>
          <button onClick={handleGlobalCompanyExport}
            className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 transition-colors shrink-0">
            <Download size={13} /> Export Companies
          </button>
          <button onClick={() => navigate('/hr/new-worker')}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors shrink-0">
            <Plus size={13} /> New Worker
          </button>
          <button onClick={() => navigate('/hr/new-contract')}
            className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 transition-colors shrink-0">
            <FileText size={13} /> New Contract
          </button>
          <button onClick={() => navigate('/hr/register-payment')}
            className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 transition-colors shrink-0">
            <CreditCard size={13} /> Register Payment
          </button>
        </div>
      </div>

      {showExport && <ExportModal onClose={() => setShowExport(false)} workers={exportData} companies={exportCompanyData} />}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-5 overflow-x-auto">
        {(['workers', 'companies', 'contracts'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px shrink-0
              ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t === 'workers' ? `Workers (${workers.length})` : t === 'companies' ? `Companies (${companies.length})` : `Contracts (${allContracts.length})`}
          </button>
        ))}
      </div>

      {/* ── Workers tab ── */}
      {tab === 'workers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className={`col-span-1 space-y-2 ${mobileDetailOpen && mobileDetailType === 'worker' ? 'hidden md:block' : 'block'}`}>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search worker..." value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => search && setShowSug(true)}
                onBlur={() => setTimeout(() => setShowSug(false), 150)}
              />
              {showSug && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  {suggestions.map(w => (
                    <button key={w.id} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-blue-50 text-left"
                      onClick={() => { selectWorker(w); setSearch(w.name); setShowSug(false) }}>
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">{w.name[0]}</div>
                      <div><p className="font-medium text-gray-900">{w.name}</p><p className="text-xs text-gray-400">{w.role} · {w.type}</p></div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {loading ? (
              <div className="text-center py-8 text-sm text-gray-400">Loading...</div>
            ) : displayedWorkers.length === 0 ? (
              <div className="text-center py-8">
                <User size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">No workers yet</p>
                <button onClick={() => navigate('/hr/new-worker')} className="mt-3 text-sm text-blue-600 hover:underline">Add first worker</button>
              </div>
            ) : displayedWorkers.map(w => (
              <button key={w.id} onClick={() => { selectWorker(w); setSearch('') }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all
                  ${selected?.id === w.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'}`}>
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">{w.name[0]}</div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-semibold text-gray-900 truncate">{w.name}</p>
                  <p className="text-xs text-gray-400">{w.role} · {w.type}</p>
                </div>
                <ChevronRight size={14} className="text-gray-300 shrink-0" />
              </button>
            ))}
          </div>

          <div className={`md:col-span-2 ${mobileDetailOpen && mobileDetailType === 'worker' ? 'block' : 'hidden md:block'}`}>
            {loadingDetail ? (
              <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center h-64">
                <p className="text-sm text-gray-400">Loading...</p>
              </div>
            ) : selected ? (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 md:p-5 border-b border-gray-100">
                  <button onClick={() => setMobileDetailOpen(false)}
                    className="flex items-center gap-1.5 text-xs text-blue-600 mb-3 md:hidden">
                    <ArrowLeft size={14} /> Back to workers
                  </button>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0">{selected.name[0]}</div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-gray-900">{selected.name}</h2>
                      <p className="text-sm text-gray-500">{selected.role} · {selected.type}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                        {selected.email && <span className="truncate">✉ {selected.email}</span>}
                        {selected.phone && <span>📞 {selected.phone}</span>}
                        {selected.state && <span>📍 {selected.state}</span>}
                      </div>
                    </div>
                    <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full font-medium shrink-0 hidden sm:inline">
                      {selected.workAuthorization}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-50">
                    <div><p className="text-xs text-gray-400">SSN</p><p className="text-sm font-medium text-gray-700">***-**-{selected.ssn.slice(-4)}</p></div>
                    {selected.ein && <div><p className="text-xs text-gray-400">EIN</p><p className="text-sm font-medium text-gray-700">{selected.ein}</p></div>}
                    <div>
                      <p className="text-xs text-gray-400">Company</p>
                      <p className="text-sm font-medium text-gray-700">
                        {selected.companyId ? (companies.find(c => c.id === selected.companyId)?.name ?? 'Unknown') : 'Silver Star Direct'}
                      </p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-xs text-gray-400">Total Paid</p>
                      <p className="text-sm font-bold text-green-600">${totalPaid(selected.contracts || []).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                      <div className="flex items-center gap-2 mt-2 justify-end">
                        <button onClick={() => setEditingWorker(selected)}
                          className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 px-2 py-1.5 rounded-md border border-gray-200 transition-colors">
                          <Pencil size={12} /> Edit
                        </button>
                        <button onClick={() => { setExportData([selected]); setExportCompanyData([]); setShowExport(true) }}
                          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1.5 rounded-md border border-blue-100 transition-colors">
                          <Download size={12} /> Export
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 md:p-5">
                  <h3 className="text-sm font-bold text-gray-800 mb-3">Contracts ({(selected.contracts || []).length})</h3>
                  {(selected.contracts || []).length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <p className="text-xs text-gray-400">No contracts yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selected.contracts.map(contract => (
                        <div key={contract.id} className="border border-gray-100 rounded-lg overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-800 truncate">{contract.project?.name}</p>
                              <p className="text-xs text-gray-400">
                                {new Date(contract.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                {' → '}
                                {new Date(contract.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-2 shrink-0">
                              <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">${Number(contract.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                <p className="text-xs text-gray-400">{contract.paymentType}</p>
                              </div>
                              <button onClick={() => setEditingContract({ ...contract, value: Number(contract.value) } as any)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-white hover:text-gray-600 transition-colors">
                                <Pencil size={13} />
                              </button>
                            </div>
                          </div>
                          {contract.payments.length > 0
                            ? <div className="divide-y divide-gray-50">{contract.payments.map(p => (
                              <PaymentRow key={p.id} payment={p} onViewReceipt={url => { setZoom(1); setReceiptModal(url) }} />
                            ))}</div>
                            : <div className="px-4 py-2.5 text-xs text-gray-400">No payments yet</div>
                          }
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 border-dashed hidden md:flex items-center justify-center h-64">
                <div className="text-center"><User size={32} className="mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Select a worker to see details</p></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Companies tab ── */}
      {tab === 'companies' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className={`col-span-1 space-y-2 ${mobileDetailOpen && mobileDetailType === 'company' ? 'hidden md:block' : 'block'}`}>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search company..." value={companySearch} onChange={e => setCompanySearch(e.target.value)} />
            </div>
            {companies.length === 0 ? (
              <div className="text-center py-8"><Building2 size={32} className="mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No companies yet</p></div>
            ) : companies.filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase())).map(c => (
              <button key={c.id}
                onClick={() => { setSelectedCompany(c); setMobileDetailOpen(true); setMobileDetailType('company') }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all
                  ${selectedCompany?.id === c.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'}`}>
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0"><Building2 size={16} className="text-gray-500" /></div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                  <p className="text-xs text-gray-400">EIN: {c.ein}</p>
                </div>
                <ChevronRight size={14} className="text-gray-300 shrink-0" />
              </button>
            ))}
          </div>

          <div className={`md:col-span-2 ${mobileDetailOpen && mobileDetailType === 'company' ? 'block' : 'hidden md:block'}`}>
            {selectedCompany ? (() => {
              const companyContracts = allContracts.filter(c => c.companyId === selectedCompany.id)
              const totalPaidCompany = companyContracts.flatMap(c => c.payments || []).reduce((sum, p) => sum + Number(p.amount), 0)
              return (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="p-4 md:p-5 border-b border-gray-100">
                    <button onClick={() => setMobileDetailOpen(false)} className="flex items-center gap-1.5 text-xs text-blue-600 mb-3 md:hidden">
                      <ArrowLeft size={14} /> Back to companies
                    </button>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0"><Building2 size={22} className="text-gray-500" /></div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-gray-900">{selectedCompany.name}</h2>
                        <p className="text-sm text-gray-500">EIN: {selectedCompany.ein}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                          {selectedCompany.email && <span className="truncate">✉ {selectedCompany.email}</span>}
                          {selectedCompany.phone && <span>📞 {selectedCompany.phone}</span>}
                          {selectedCompany.contactPerson && <span>👤 {selectedCompany.contactPerson}</span>}
                          {selectedCompany.state && <span>📍 {selectedCompany.state}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-50">
                      <div><p className="text-xs text-gray-400">Contracts</p><p className="text-sm font-bold text-gray-700">{companyContracts.length}</p></div>
                      <div className="ml-auto text-right">
                        <p className="text-xs text-gray-400">Total Paid</p>
                        <p className="text-sm font-bold text-green-600">${totalPaidCompany.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        <div className="flex items-center gap-2 mt-2 justify-end">
                          <button onClick={() => setEditingCompany(selectedCompany)}
                            className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 px-2 py-1.5 rounded-md border border-gray-200 transition-colors">
                            <Pencil size={12} /> Edit
                          </button>
                          <button onClick={() => { setExportCompanyData([{ ...selectedCompany, contracts: companyContracts }]); setExportData([]); setShowExport(true) }}
                            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1.5 rounded-md border border-blue-100 transition-colors">
                            <Download size={12} /> Export
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 md:p-5">
                    <h3 className="text-sm font-bold text-gray-800 mb-3">Contracts ({companyContracts.length})</h3>
                    {companyContracts.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200"><p className="text-xs text-gray-400">No contracts yet</p></div>
                    ) : (
                      <div className="space-y-3">
                        {companyContracts.map(contract => (
                          <div key={contract.id} className="border border-gray-100 rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-gray-800 truncate">{(contract as any).project?.name ?? contract.projectId}</p>
                                <p className="text-xs text-gray-400">
                                  {new Date(contract.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  {' → '}
                                  {new Date(contract.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 ml-2 shrink-0">
                                <div className="text-right">
                                  <p className="text-sm font-bold text-gray-900">${Number(contract.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                  <p className="text-xs text-gray-400">{contract.paymentType}</p>
                                </div>
                                <button onClick={() => setEditingContract(contract)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-white hover:text-gray-600 transition-colors">
                                  <Pencil size={13} />
                                </button>
                              </div>
                            </div>
                            {(contract.payments || []).length > 0
                              ? <div className="divide-y divide-gray-50">{(contract.payments || []).map(p => (
                                <PaymentRow key={p.id} payment={p} onViewReceipt={url => { setZoom(1); setReceiptModal(url) }} />
                              ))}</div>
                              : <div className="px-4 py-2.5 text-xs text-gray-400">No payments yet</div>
                            }
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })() : (
              <div className="bg-white rounded-xl border border-gray-200 border-dashed hidden md:flex items-center justify-center h-64">
                <div className="text-center"><Building2 size={32} className="mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Select a company to see details</p></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Contracts tab ── */}
      {tab === 'contracts' && (
        <div>
          {allContracts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200 border-dashed">
              <FileText size={32} className="mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No contracts yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allContracts.map(c => (
                <div key={c.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3 flex-wrap md:flex-nowrap">
                  <div className="flex items-center gap-3 w-full md:w-48 shrink-0">
                    {c.worker
                      ? <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{c.worker.name[0]}</div>
                      : <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0"><Building2 size={14} className="text-gray-500" /></div>
                    }
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{c.worker?.name ?? c.company?.name ?? '—'}</p>
                      <p className="text-xs text-gray-400">{c.worker?.role ?? `EIN: ${c.company?.ein ?? '—'}`}</p>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 hidden md:block">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Project</p>
                    <p className="text-sm font-medium text-gray-700 truncate">{(c as any).project?.name ?? c.projectId}</p>
                  </div>
                  <div className="flex items-center gap-4 ml-auto">
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{(c as any).project?.name ?? c.projectId}</p>
                      <p className="text-sm font-bold text-gray-900">${Number(c.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                      <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-medium">{c.paymentType}</span>
                    </div>
                    <button onClick={() => setEditingContract(c)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors shrink-0">
                      <Pencil size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Receipt Modal ── */}
      {receiptModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 md:p-4" onClick={() => setReceiptModal(null)}>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[95vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">Receipt</p>
              <div className="flex items-center gap-2">
                <a href={receiptModal} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                  Open original
                </a>
                <button onClick={() => setReceiptModal(null)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={15} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-start justify-center">
              <img src={receiptModal} alt="Receipt"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.15s' }}
                className="max-w-full object-contain" />
            </div>
            <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <button onClick={() => setZoom(z => Math.max(0.5, parseFloat((z - 0.2).toFixed(1))))}
                className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">Zoom −</button>
              <span className="text-sm text-gray-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(3, parseFloat((z + 0.2).toFixed(1))))}
                className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">Zoom +</button>
              <button onClick={() => setZoom(1)}
                className="px-3 py-1.5 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">Reset</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {editingContract && (
        <EditContractModal contract={editingContract} onClose={() => setEditingContract(null)} onSaved={handleContractSaved} />
      )}
      {editingCompany && (
        <EditCompanyModal company={editingCompany} onClose={() => setEditingCompany(null)} onSaved={handleCompanySaved} />
      )}
      {editingWorker && (
        <EditWorkerModal worker={editingWorker} companies={companies} onClose={() => setEditingWorker(null)} onSaved={handleWorkerSaved} />
      )}
    </div>
  )
}