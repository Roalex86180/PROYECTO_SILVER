import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, Plus, X, Building2 } from 'lucide-react'
import FormField from '../../components/ui/FormField'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import { workerService, type Worker } from '../../services/workerService'
import { companyService, type Company } from '../../services/companyService'
import { contractService } from '../../services/contractService'
import { projectService, type Project } from '../../services/projectService'

const PAYMENT_TYPES = [
  { value: 'Per Project', label: 'Per Project' },
  { value: 'Daily',       label: 'Daily'       },
  { value: 'Weekly',      label: 'Weekly'      },
  { value: 'Biweekly',    label: 'Biweekly'    },
  { value: 'Monthly',     label: 'Monthly'     },
]

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
]

// ─── Mini modal para crear Company ──────────────────────────────────────────
function NewCompanyModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (company: Company) => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [form, setForm] = useState({
    name: '', ein: '', contactPerson: '',
    phone: '', email: '', address: '', state: '', notes: '',
  })

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Company name is required'); return }
    if (!form.ein.trim())  { setError('EIN is required'); return }
    setSaving(true)
    try {
      const company = await companyService.create(form)
      onCreated(company)
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error creating company')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Building2 size={16} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">New Company</h2>
              <p className="text-xs text-gray-400">Add a subcontractor or company</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FormField label="Company Name" required>
                <Input
                  placeholder="ABC Contractors LLC"
                  value={form.name}
                  onChange={e => { set('name', e.target.value); setError('') }}
                />
              </FormField>
            </div>

            <FormField label="EIN" required>
              <Input
                placeholder="12-3456789"
                value={form.ein}
                onChange={e => { set('ein', e.target.value); setError('') }}
              />
            </FormField>

            <FormField label="Contact Person">
              <Input
                placeholder="John Smith"
                value={form.contactPerson}
                onChange={e => set('contactPerson', e.target.value)}
              />
            </FormField>

            <FormField label="Phone">
              <Input
                placeholder="(555) 000-0000"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
              />
            </FormField>

            <FormField label="Email">
              <Input
                type="email"
                placeholder="contact@company.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
              />
            </FormField>

            <FormField label="Address">
              <Input
                placeholder="123 Main St"
                value={form.address}
                onChange={e => set('address', e.target.value)}
              />
            </FormField>

            <FormField label="State">
              <Select
                options={US_STATES.map(s => ({ value: s, label: s }))}
                placeholder="Select state..."
                value={form.state}
                onChange={e => set('state', e.target.value)}
              />
            </FormField>

            <div className="col-span-2">
              <FormField label="Notes">
                <textarea
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                  placeholder="Optional notes..."
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                />
              </FormField>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>
            <Building2 size={14} /> Save Company
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function NewContract() {
  const navigate = useNavigate()
  const [loading,        setLoading]        = useState(false)
  const [workers,        setWorkers]        = useState<Worker[]>([])
  const [companies,      setCompanies]      = useState<Company[]>([])
  const [projects,       setProjects]       = useState<Project[]>([])
  const [errors,         setErrors]         = useState<Record<string, string>>({})
  const [assignTo,       setAssignTo]       = useState<'worker' | 'company'>('worker')
  const [showNewCompany, setShowNewCompany] = useState(false)

  const [form, setForm] = useState({
    workerId: '', companyId: '', projectId: '',
    startDate: '', endDate: '', paymentType: '', value: '',
  })

  useEffect(() => {
    workerService.getAll().then(setWorkers)
    companyService.getAll().then(setCompanies)
    projectService.getAll().then(setProjects)
  }, [])

  const set = (field: string, value: string) => {
    setForm(p => ({ ...p, [field]: value }))
    setErrors(p => ({ ...p, [field]: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (assignTo === 'worker'  && !form.workerId)  e.workerId  = 'Select a worker'
    if (assignTo === 'company' && !form.companyId) e.companyId = 'Select a company'
    if (!form.projectId)   e.projectId   = 'Select a project'
    if (!form.startDate)   e.startDate   = 'Start date is required'
    if (!form.endDate)     e.endDate     = 'End date is required'
    if (!form.paymentType) e.paymentType = 'Payment type is required'
    if (!form.value)       e.value       = 'Contract value is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await contractService.create({
        workerId:    assignTo === 'worker'  ? form.workerId  || undefined : undefined,
        companyId:   assignTo === 'company' ? form.companyId || undefined : undefined,
        projectId:   form.projectId,
        startDate:   form.startDate,
        endDate:     form.endDate,
        paymentType: form.paymentType,
        value:       Number(form.value),
      })
      navigate('/hr/register-payment')
    } catch (err: any) {
      setErrors({ submit: err.response?.data?.error || 'Error creating contract' })
    } finally {
      setLoading(false)
    }
  }

  // Cuando se crea una company nueva: agregarla a la lista y seleccionarla
  const handleCompanyCreated = (company: Company) => {
    setCompanies(prev => [company, ...prev])
    set('companyId', company.id)
    setShowNewCompany(false)
  }

  const workerOptions  = workers.map(w  => ({ value: w.id,  label: `${w.name} — ${w.role}` }))
  const companyOptions = companies.map(c => ({ value: c.id, label: `${c.name} (EIN: ${c.ein})` }))
  const projectOptions = projects.map(p  => ({ value: p.id,  label: p.name }))

  return (
    <div className="max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/hr')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">New Contract</h1>
          <p className="text-sm text-gray-500">Assign a project contract to a worker or company</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="space-y-4">

          {/* Toggle Worker / Company */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit mb-2">
            <button
              onClick={() => setAssignTo('worker')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors
                ${assignTo === 'worker'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'}`}
            >
              Individual Worker
            </button>
            <button
              onClick={() => setAssignTo('company')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors
                ${assignTo === 'company'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'}`}
            >
              Company
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">

            {/* Worker */}
            {assignTo === 'worker' ? (
              <div className="col-span-2">
                <FormField label="Worker" required error={errors.workerId}>
                  <Select
                    options={workerOptions}
                    placeholder="Select worker..."
                    value={form.workerId}
                    onChange={e => set('workerId', e.target.value)}
                    error={!!errors.workerId}
                  />
                </FormField>
              </div>
            ) : (
              /* Company + botón New Company */
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Company <span className="text-red-500">*</span>
                  </label>
                  <button
                    onClick={() => setShowNewCompany(true)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    <Plus size={12} /> New Company
                  </button>
                </div>
                <Select
                  options={companyOptions}
                  placeholder={companies.length ? 'Select company...' : 'No companies yet — add one →'}
                  value={form.companyId}
                  onChange={e => set('companyId', e.target.value)}
                  error={!!errors.companyId}
                />
                {errors.companyId && (
                  <p className="text-xs text-red-500 mt-1">{errors.companyId}</p>
                )}
              </div>
            )}

            {/* Project */}
            <div className="col-span-2">
              <FormField label="Project" required error={errors.projectId}>
                <Select
                  options={projectOptions}
                  placeholder={projects.length ? 'Select project...' : 'No projects created yet...'}
                  value={form.projectId}
                  onChange={e => set('projectId', e.target.value)}
                  error={!!errors.projectId}
                />
              </FormField>
            </div>

            <FormField label="Start Date" required error={errors.startDate}>
              <Input
                type="date"
                value={form.startDate}
                onChange={e => set('startDate', e.target.value)}
                error={!!errors.startDate}
              />
            </FormField>

            <FormField label="End Date" required error={errors.endDate}>
              <Input
                type="date"
                value={form.endDate}
                onChange={e => set('endDate', e.target.value)}
                error={!!errors.endDate}
              />
            </FormField>

            <FormField label="Payment Type" required error={errors.paymentType}>
              <Select
                options={PAYMENT_TYPES}
                placeholder="Select type..."
                value={form.paymentType}
                onChange={e => set('paymentType', e.target.value)}
                error={!!errors.paymentType}
              />
            </FormField>

            <FormField label="Contract Value ($)" required error={errors.value}>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.value}
                onChange={e => set('value', e.target.value)}
                error={!!errors.value}
              />
            </FormField>

          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
              {errors.submit}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={() => navigate('/hr')}>
            <ArrowLeft size={16} /> Back
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            <FileText size={16} /> Save Contract
          </Button>
        </div>
      </div>

      {/* Modal New Company */}
      {showNewCompany && (
        <NewCompanyModal
          onClose={() => setShowNewCompany(false)}
          onCreated={handleCompanyCreated}
        />
      )}
    </div>
  )
}