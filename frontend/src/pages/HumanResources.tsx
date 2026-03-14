import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FileText, CreditCard, Search, User, Building2, ChevronRight, Download, Pencil, X, Paperclip } from 'lucide-react'
import { workerService, type Worker } from '../services/workerService'
import { companyService, type Company } from '../services/companyService'
import { contractService, type Contract } from '../services/contractService'
import ExportModal from '../components/ui/ExportModal'
import FormField from '../components/ui/FormField'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Button from '../components/ui/Button'

// ─── Types ────────────────────────────────────────────────────────────────────
type Payment = {
  id: string
  concept: string
  amount: string
  date: string
  method: string
  notes?: string
}

type ContractLocal = {
  id: string
  projectId: string
  startDate: string
  endDate: string
  paymentType: string
  value: string
  project: { id: string; name: string; location?: string }
  payments: Payment[]
}

type ContractFull = Contract & {
  worker?: { id: string; name: string; role: string }
  company?: { id: string; name: string; ein: string }
  payments: Payment[]
}

type WorkerDetail = Worker & { contracts: ContractLocal[] }

// ─── Constants ────────────────────────────────────────────────────────────────
const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
].map(s => ({ value: s, label: s }))

const ROLES = [
  'Electrician', 'Plumber', 'Carpenter', 'Painter', 'Installer',
  'Supervisor', 'General Helper', 'Mason', 'Other'
].map(r => ({ value: r, label: r }))

const WORKER_TYPES = [
  { value: 'W-2 Employee', label: 'W-2 Employee' },
  { value: '1099 Contractor', label: '1099 Contractor' },
  { value: 'Subcontractor', label: 'Subcontractor' },
]

const WORK_AUTH = [
  { value: 'US Citizen', label: 'US Citizen' },
  { value: 'Permanent Resident', label: 'Permanent Resident (Green Card)' },
  { value: 'Work Visa', label: 'Work Visa (H-2B / H-1B)' },
  { value: 'EAD', label: 'Employment Authorization (EAD)' },
  { value: 'TN Visa', label: 'TN Visa (Canada/Mexico)' },
]

const PAYMENT_TYPES = [
  { value: 'Fixed', label: 'Fixed' },
  { value: 'Hourly', label: 'Hourly' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Biweekly', label: 'Biweekly' },
  { value: 'Monthly', label: 'Monthly' },
]

// ─── Edit Contract Modal ──────────────────────────────────────────────────────
function EditContractModal({ contract, onClose, onSaved }: {
  contract: ContractFull
  onClose: () => void
  onSaved: (updated: ContractFull) => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    startDate: contract.startDate ? contract.startDate.slice(0, 10) : '',
    endDate: contract.endDate ? contract.endDate.slice(0, 10) : '',
    paymentType: contract.paymentType || '',
    value: String(contract.value || ''),
  })

  const set = (k: string, v: string) => { setForm(p => ({ ...p, [k]: v })); setError('') }

  const handleSave = async () => {
    if (!form.startDate || !form.endDate || !form.paymentType || !form.value) {
      setError('All fields are required'); return
    }
    setSaving(true)
    try {
      const updated = await contractService.update(contract.id, {
        startDate: form.startDate,
        endDate: form.endDate,
        paymentType: form.paymentType,
        value: parseFloat(form.value),
      })
      onSaved({ ...contract, ...updated })
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error updating contract')
      setSaving(false)
    }
  }

  const entityName = contract.worker?.name ?? contract.company?.name ?? '—'
  const projectName = (contract as any).project?.name ?? contract.projectId

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileText size={16} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Edit Contract</h2>
              <p className="text-xs text-gray-400">{entityName} · {projectName}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-3">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Project</p>
              <p className="text-xs font-semibold text-gray-700 truncate">{projectName}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">{contract.worker ? 'Worker' : 'Company'}</p>
              <p className="text-xs font-semibold text-gray-700 truncate">{entityName}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Start Date <span className="text-red-500">*</span></label>
              <input type="date" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">End Date <span className="text-red-500">*</span></label>
              <input type="date" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.endDate} onChange={e => set('endDate', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Payment Type <span className="text-red-500">*</span></label>
              <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={form.paymentType} onChange={e => set('paymentType', e.target.value)}>
                <option value="">Select...</option>
                {PAYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Value (USD) <span className="text-red-500">*</span></label>
              <input type="number" min="0" step="0.01" placeholder="0.00"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.value} onChange={e => set('value', e.target.value)} />
            </div>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}><Pencil size={14} /> Save Changes</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Company Modal ───────────────────────────────────────────────────────
function EditCompanyModal({ company, onClose, onSaved }: {
  company: Company
  onClose: () => void
  onSaved: (updated: Company) => void
}) {
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    name: company.name || '',
    ein: company.ein || '',
    contactPerson: company.contactPerson || '',
    phone: company.phone || '',
    email: company.email || '',
    address: company.address || '',
    state: company.state || '',
    notes: company.notes || '',
  })

  const set = (k: string, v: string) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })) }

  const handleSave = async () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.ein.trim()) e.ein = 'Required'
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setSaving(true)
    try {
      const updated = await companyService.update(company.id, form)
      onSaved(updated)
    } catch (err: any) {
      setErrors({ submit: err.response?.data?.error || 'Error updating company' })
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <Building2 size={16} className="text-gray-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Edit Company</h2>
              <p className="text-xs text-gray-400">{company.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <FormField label="Company Name" required error={errors.name}>
                <Input value={form.name} onChange={e => set('name', e.target.value)} error={!!errors.name} />
              </FormField>
            </div>
            <FormField label="EIN" required error={errors.ein}>
              <Input placeholder="12-3456789" value={form.ein} onChange={e => set('ein', e.target.value)} error={!!errors.ein} />
            </FormField>
            <FormField label="Contact Person">
              <Input placeholder="John Smith" value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} />
            </FormField>
            <FormField label="Phone">
              <Input placeholder="(555) 000-0000" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </FormField>
            <FormField label="Email">
              <Input type="email" placeholder="contact@company.com" value={form.email} onChange={e => set('email', e.target.value)} />
            </FormField>
            <FormField label="Address">
              <Input placeholder="123 Main St" value={form.address} onChange={e => set('address', e.target.value)} />
            </FormField>
            <FormField label="State">
              <Select options={US_STATES} placeholder="Select state..." value={form.state} onChange={e => set('state', e.target.value)} />
            </FormField>
            <div className="col-span-2">
              <FormField label="Notes">
                <textarea className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2} placeholder="Optional notes..." value={form.notes} onChange={e => set('notes', e.target.value)} />
              </FormField>
            </div>
          </div>
          {errors.submit && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mt-3">{errors.submit}</div>}
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}><Pencil size={14} /> Save Changes</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Worker Modal ────────────────────────────────────────────────────────
function EditWorkerModal({ worker, companies, onClose, onSaved }: {
  worker: WorkerDetail
  companies: Company[]
  onClose: () => void
  onSaved: (updated: Worker) => void
}) {
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    name: worker.name || '',
    ssn: worker.ssn || '',
    ein: worker.ein || '',
    phone: worker.phone || '',
    email: worker.email || '',
    address: worker.address || '',
    state: worker.state || '',
    workAuthorization: worker.workAuthorization || '',
    role: worker.role || '',
    type: worker.type || '',
    companyId: worker.companyId || '',
    emergencyContact: worker.emergencyContact || '',
    emergencyPhone: worker.emergencyPhone || '',
  })

  const set = (k: string, v: string) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })) }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name) e.name = 'Required'
    if (!form.ssn) e.ssn = 'Required'
    if (!form.role) e.role = 'Required'
    if (!form.type) e.type = 'Required'
    if (!form.workAuthorization) e.workAuthorization = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const updated = await workerService.update(worker.id, {
        name: form.name,
        ssn: form.ssn,
        ein: form.ein || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        state: form.state || undefined,
        workAuthorization: form.workAuthorization,
        role: form.role,
        type: form.type,
        companyId: form.companyId || undefined,
        emergencyContact: form.emergencyContact || undefined,
        emergencyPhone: form.emergencyPhone || undefined,
      })
      onSaved(updated)
    } catch (e: any) {
      setErrors({ submit: e.response?.data?.error || 'Error updating worker' })
      setSaving(false)
    }
  }

  const companyOptions = [
    { value: '', label: 'None (Silver Star direct employee)' },
    ...companies.map(c => ({ value: c.id, label: `${c.name} (EIN: ${c.ein})` })),
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
              {worker.name[0]}
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Edit Worker</h2>
              <p className="text-xs text-gray-400">{worker.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Personal Information</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <FormField label="Full Name" required error={errors.name}>
                  <Input value={form.name} onChange={e => set('name', e.target.value)} error={!!errors.name} />
                </FormField>
              </div>
              <FormField label="SSN" required error={errors.ssn}>
                <Input placeholder="XXX-XX-XXXX" value={form.ssn} onChange={e => set('ssn', e.target.value)} error={!!errors.ssn} maxLength={11} />
              </FormField>
              <FormField label="EIN (if applicable)">
                <Input placeholder="XX-XXXXXXX" value={form.ein} onChange={e => set('ein', e.target.value)} />
              </FormField>
              <FormField label="Phone">
                <Input placeholder="+1 (555) 000-0000" value={form.phone} onChange={e => set('phone', e.target.value)} />
              </FormField>
              <FormField label="Email">
                <Input type="email" placeholder="john@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
              </FormField>
              <div className="col-span-2">
                <FormField label="Address">
                  <Input placeholder="123 Main St, City" value={form.address} onChange={e => set('address', e.target.value)} />
                </FormField>
              </div>
              <FormField label="State">
                <Select options={US_STATES} placeholder="Select state..." value={form.state} onChange={e => set('state', e.target.value)} />
              </FormField>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Work Information</p>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Role" required error={errors.role}>
                <Select options={ROLES} placeholder="Select role..." value={form.role} onChange={e => set('role', e.target.value)} error={!!errors.role} />
              </FormField>
              <FormField label="Worker Type" required error={errors.type}>
                <Select options={WORKER_TYPES} placeholder="Select type..." value={form.type} onChange={e => set('type', e.target.value)} error={!!errors.type} />
              </FormField>
              <div className="col-span-2">
                <FormField label="Work Authorization" required error={errors.workAuthorization}>
                  <Select options={WORK_AUTH} placeholder="Select authorization..." value={form.workAuthorization} onChange={e => set('workAuthorization', e.target.value)} error={!!errors.workAuthorization} />
                </FormField>
              </div>
              <div className="col-span-2">
                <FormField label="Company (if applicable)">
                  <Select options={companyOptions} placeholder="Select company..." value={form.companyId} onChange={e => set('companyId', e.target.value)} />
                </FormField>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Emergency Contact</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <FormField label="Contact Name">
                  <Input placeholder="Jane Smith" value={form.emergencyContact} onChange={e => set('emergencyContact', e.target.value)} />
                </FormField>
              </div>
              <FormField label="Contact Phone">
                <Input placeholder="+1 (555) 000-0000" value={form.emergencyPhone} onChange={e => set('emergencyPhone', e.target.value)} />
              </FormField>
            </div>
          </div>
          {errors.submit && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">{errors.submit}</div>}
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}><Pencil size={14} /> Save Changes</Button>
        </div>
      </div>
    </div>
  )
}

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

  useEffect(() => {
    Promise.all([
      workerService.getAll(),
      companyService.getAll(),
      contractService.getAll(),
    ]).then(([w, c, k]) => {
      setWorkers(w)
      setCompanies(c)
      setAllContracts(k as ContractFull[])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (search.length > 0) {
      setSuggestions(workers.filter(w => w.name.toLowerCase().includes(search.toLowerCase())))
      setShowSug(true)
    } else {
      setSuggestions([]); setShowSug(false)
    }
  }, [search, workers])

  const selectWorker = async (w: Worker) => {
    setLoadingDetail(true)
    try {
      const detail = await workerService.getById(w.id)
      setSelected(detail as WorkerDetail)
    } catch {
      setSelected(w as WorkerDetail)
    } finally {
      setLoadingDetail(false)
    }
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
    setExportCompanyData(
      companies.map(c => ({
        ...c,
        contracts: allContracts.filter(ct => ct.companyId === c.id)
      }))
    )
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
      contracts: (prev.contracts || []).map(c =>
        c.id === updated.id ? { ...c, ...updated, value: String(updated.value) } : c
      )
    } : prev)
    setEditingContract(null)
  }

  const displayedWorkers = search
    ? workers.filter(w => w.name.toLowerCase().includes(search.toLowerCase()))
    : workers

  const totalPaid = (contracts: ContractLocal[]) =>
    contracts.flatMap(c => c.payments).reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Human Resources</h1>
          <p className="text-sm text-gray-500 mt-0.5">{workers.length} workers · {companies.length} companies</p>
        </div>
        <div className="flex gap-2">
          <button
            disabled={isPreparingExport}
            onClick={handleGlobalExport}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 transition-colors disabled:opacity-50"
          >
            <Download size={15} /> {isPreparingExport ? 'Preparing...' : 'Export Workers'}
          </button>
          <button
            onClick={handleGlobalCompanyExport}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 transition-colors"
          >
            <Download size={15} /> Export Companies
          </button>
          <button
            onClick={() => navigate('/hr/new-worker')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} /> New Worker
          </button>
          <button
            onClick={() => navigate('/hr/new-contract')}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 transition-colors"
          >
            <FileText size={15} /> New Contract
          </button>
          <button
            onClick={() => navigate('/hr/register-payment')}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 transition-colors"
          >
            <CreditCard size={15} /> Register Payment
          </button>
        </div>
      </div>

      {showExport && (
        <ExportModal
          onClose={() => setShowExport(false)}
          workers={exportData}
          companies={exportCompanyData}
        />
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-5">
        {(['workers', 'companies', 'contracts'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px
              ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t === 'workers' ? `Workers (${workers.length})` :
              t === 'companies' ? `Companies (${companies.length})` :
                `Contracts (${allContracts.length})`}
          </button>
        ))}
      </div>

      {/* ── Workers tab ── */}
      {tab === 'workers' && (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-1 space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search worker..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => search && setShowSug(true)}
                onBlur={() => setTimeout(() => setShowSug(false), 150)}
              />
              {showSug && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  {suggestions.map(w => (
                    <button key={w.id}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-blue-50 text-left"
                      onClick={() => { selectWorker(w); setSearch(w.name); setShowSug(false) }}
                    >
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                        {w.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{w.name}</p>
                        <p className="text-xs text-gray-400">{w.role} · {w.type}</p>
                      </div>
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
                <button onClick={() => navigate('/hr/new-worker')} className="mt-3 text-sm text-blue-600 hover:underline">
                  Add first worker
                </button>
              </div>
            ) : (
              displayedWorkers.map(w => (
                <button key={w.id}
                  onClick={() => { selectWorker(w); setSearch('') }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all
                    ${selected?.id === w.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'}`}
                >
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {w.name[0]}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-semibold text-gray-900 truncate">{w.name}</p>
                    <p className="text-xs text-gray-400">{w.role} · {w.type}</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 shrink-0" />
                </button>
              ))
            )}
          </div>

          <div className="col-span-2">
            {loadingDetail ? (
              <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center h-64">
                <p className="text-sm text-gray-400">Loading...</p>
              </div>
            ) : selected ? (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {selected.name[0]}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-gray-900">{selected.name}</h2>
                      <p className="text-sm text-gray-500">{selected.role} · {selected.type}</p>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
                        {selected.email && <span>✉ {selected.email}</span>}
                        {selected.phone && <span>📞 {selected.phone}</span>}
                        {selected.state && <span>📍 {selected.address}, {selected.state}</span>}
                      </div>
                    </div>
                    <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full font-medium shrink-0">
                      {selected.workAuthorization}
                    </span>
                  </div>
                  <div className="flex gap-6 mt-4 pt-4 border-t border-gray-50">
                    <div>
                      <p className="text-xs text-gray-400">SSN</p>
                      <p className="text-sm font-medium text-gray-700">***-**-{selected.ssn.slice(-4)}</p>
                    </div>
                    {selected.ein && (
                      <div>
                        <p className="text-xs text-gray-400">EIN</p>
                        <p className="text-sm font-medium text-gray-700">{selected.ein}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-400">Company</p>
                      <p className="text-sm font-medium text-gray-700">
                        {selected.companyId
                          ? (companies.find(c => c.id === selected.companyId)?.name ?? 'Unknown')
                          : 'Silver Star Direct'}
                      </p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-xs text-gray-400">Total Paid</p>
                      <p className="text-sm font-bold text-green-600">
                        ${totalPaid(selected.contracts || []).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
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

                {/* Contracts */}
                <div className="p-5">
                  <h3 className="text-sm font-bold text-gray-800 mb-3">
                    Contracts ({(selected.contracts || []).length})
                  </h3>
                  {(selected.contracts || []).length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <p className="text-xs text-gray-400">No contracts yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selected.contracts.map(contract => (
                        <div key={contract.id} className="border border-gray-100 rounded-lg overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{contract.project?.name}</p>
                              <p className="text-xs text-gray-400">
                                {new Date(contract.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                {' → '}
                                {new Date(contract.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">${Number(contract.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                <p className="text-xs text-gray-400">{contract.paymentType}</p>
                              </div>
                              <button
                                onClick={() => setEditingContract({ ...contract, value: Number(contract.value) } as any)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-white hover:text-gray-600 transition-colors"
                                title="Edit contract"
                              >
                                <Pencil size={13} />
                              </button>
                            </div>
                          </div>
                          {contract.payments.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                              {contract.payments.map(payment => (
                                <div key={payment.id} className="flex items-center justify-between px-4 py-2.5">
                                  <div>
                                    <p className="text-xs font-medium text-gray-700">{payment.concept}</p>
                                    {payment.notes && <p className="text-xs text-gray-400">{payment.notes}</p>}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <p className="text-sm font-semibold text-green-600">
                                        ${Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                      </p>
                                      <p className="text-xs text-gray-400">
                                        {payment.method} · {new Date(payment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </p>
                                    </div>
                                    {(payment as any).receiptUrl && (
                                      <button
                                        onClick={() => { setZoom(1); setReceiptModal((payment as any).receiptUrl) }}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                        title="View receipt"
                                      >
                                        <Paperclip size={13} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="px-4 py-2.5 text-xs text-gray-400">No payments yet</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 border-dashed flex items-center justify-center h-64">
                <div className="text-center">
                  <User size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">Select a worker to see details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Companies tab ── */}
      {tab === 'companies' && (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-1 space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search company..."
                value={companySearch}
                onChange={e => setCompanySearch(e.target.value)}
              />
            </div>
            {companies.length === 0 ? (
              <div className="text-center py-8">
                <Building2 size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">No companies yet</p>
              </div>
            ) : (
              companies
                .filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase()))
                .map(c => (
                  <button key={c.id}
                    onClick={() => setSelectedCompany(c)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all
                      ${selectedCompany?.id === c.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'}`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <Building2 size={16} className="text-gray-500" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                      <p className="text-xs text-gray-400">EIN: {c.ein}</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 shrink-0" />
                  </button>
                ))
            )}
          </div>

          <div className="col-span-2">
            {selectedCompany ? (() => {
              const companyContracts = allContracts.filter(c => c.companyId === selectedCompany.id)
              const totalPaidCompany = companyContracts
                .flatMap(c => c.payments || [])
                .reduce((sum, p) => sum + Number(p.amount), 0)
              return (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <Building2 size={22} className="text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-lg font-bold text-gray-900">{selectedCompany.name}</h2>
                        <p className="text-sm text-gray-500">EIN: {selectedCompany.ein}</p>
                        <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
                          {selectedCompany.email && <span>✉ {selectedCompany.email}</span>}
                          {selectedCompany.phone && <span>📞 {selectedCompany.phone}</span>}
                          {selectedCompany.contactPerson && <span>👤 {selectedCompany.contactPerson}</span>}
                          {selectedCompany.state && <span>📍 {selectedCompany.state}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-6 mt-4 pt-4 border-t border-gray-50">
                      <div>
                        <p className="text-xs text-gray-400">Contracts</p>
                        <p className="text-sm font-bold text-gray-700">{companyContracts.length}</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-xs text-gray-400">Total Paid</p>
                        <p className="text-sm font-bold text-green-600">
                          ${totalPaidCompany.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <div className="flex items-center gap-2 mt-2 justify-end">
                          <button onClick={() => setEditingCompany(selectedCompany)}
                            className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 px-2 py-1.5 rounded-md border border-gray-200 transition-colors">
                            <Pencil size={12} /> Edit
                          </button>
                          <button
                            onClick={() => {
                              setExportCompanyData([{ ...selectedCompany, contracts: companyContracts }])
                              setExportData([])
                              setShowExport(true)
                            }}
                            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1.5 rounded-md border border-blue-100 transition-colors"
                          >
                            <Download size={12} /> Export
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-sm font-bold text-gray-800 mb-3">Contracts ({companyContracts.length})</h3>
                    {companyContracts.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <p className="text-xs text-gray-400">No contracts yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {companyContracts.map(contract => (
                          <div key={contract.id} className="border border-gray-100 rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                              <div>
                                <p className="text-sm font-semibold text-gray-800">
                                  {(contract as any).project?.name ?? contract.projectId}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {new Date(contract.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  {' → '}
                                  {new Date(contract.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="text-sm font-bold text-gray-900">${Number(contract.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                  <p className="text-xs text-gray-400">{contract.paymentType}</p>
                                </div>
                                <button onClick={() => setEditingContract(contract)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-white hover:text-gray-600 transition-colors"
                                  title="Edit contract">
                                  <Pencil size={13} />
                                </button>
                              </div>
                            </div>
                            {(contract.payments || []).length > 0 ? (
                              <div className="divide-y divide-gray-50">
                                {(contract.payments || []).map(payment => (
                                  <div key={payment.id} className="flex items-center justify-between px-4 py-2.5">
                                    <div>
                                      <p className="text-xs font-medium text-gray-700">{payment.concept}</p>
                                      {payment.notes && <p className="text-xs text-gray-400">{payment.notes}</p>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="text-right">
                                        <p className="text-sm font-semibold text-green-600">
                                          ${Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                          {payment.method} · {new Date(payment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </p>
                                      </div>
                                      {(payment as any).receiptUrl && (
                                        <button
                                          onClick={() => { setZoom(1); setReceiptModal((payment as any).receiptUrl) }}
                                          className="w-7 h-7 rounded-lg flex items-center justify-center text-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                          title="View receipt"
                                        >
                                          <Paperclip size={13} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="px-4 py-2.5 text-xs text-gray-400">No payments yet</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })() : (
              <div className="bg-white rounded-xl border border-gray-200 border-dashed flex items-center justify-center h-64">
                <div className="text-center">
                  <Building2 size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">Select a company to see details</p>
                </div>
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
              <FileText size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">No contracts yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allContracts.map(c => (
                <div key={c.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 w-48 shrink-0">
                    {c.worker ? (
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {c.worker.name[0]}
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <Building2 size={14} className="text-gray-500" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{c.worker?.name ?? c.company?.name ?? '—'}</p>
                      <p className="text-xs text-gray-400">{c.worker?.role ?? `EIN: ${c.company?.ein ?? '—'}`}</p>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Project</p>
                    <p className="text-sm font-medium text-gray-700 truncate">{(c as any).project?.name ?? c.projectId}</p>
                  </div>
                  <div className="shrink-0 text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Period</p>
                    <p className="text-xs text-gray-600">
                      {new Date(c.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                      {' – '}
                      {new Date(c.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                    </p>
                  </div>
                  <div className="shrink-0 text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Type</p>
                    <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-medium">
                      {c.paymentType}
                    </span>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Value</p>
                    <p className="text-sm font-bold text-gray-900">${Number(c.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <button onClick={() => setEditingContract(c)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors shrink-0"
                    title="Edit contract">
                    <Pencil size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Receipt Modal ── */}
      {receiptModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setReceiptModal(null)}>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">Receipt</p>
              <div className="flex items-center gap-2">
                <a href={receiptModal} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                  Open original
                </a>
                <button onClick={() => setReceiptModal(null)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
                  <X size={15} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-start justify-center">
              <img src={receiptModal} alt="Receipt"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.15s' }}
                className="max-w-full object-contain" />
            </div>
            <div className="flex items-center justify-center gap-3 px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <button onClick={() => setZoom(z => Math.max(0.5, parseFloat((z - 0.2).toFixed(1))))}
                className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                Zoom −
              </button>
              <span className="text-sm text-gray-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(3, parseFloat((z + 0.2).toFixed(1))))}
                className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                Zoom +
              </button>
              <button onClick={() => setZoom(1)}
                className="px-3 py-1.5 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {editingContract && (
        <EditContractModal
          contract={editingContract}
          onClose={() => setEditingContract(null)}
          onSaved={handleContractSaved}
        />
      )}
      {editingCompany && (
        <EditCompanyModal
          company={editingCompany}
          onClose={() => setEditingCompany(null)}
          onSaved={handleCompanySaved}
        />
      )}
      {editingWorker && (
        <EditWorkerModal
          worker={editingWorker}
          companies={companies}
          onClose={() => setEditingWorker(null)}
          onSaved={handleWorkerSaved}
        />
      )}
    </div>
  )
}