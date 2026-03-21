import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
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
  { value: 'Daily', label: 'Daily' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Biweekly', label: 'Biweekly' },
  { value: 'Monthly', label: 'Monthly' },
]

export default function NewContract() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [assignTo, setAssignTo] = useState<'worker' | 'company'>('worker')

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
    if (assignTo === 'worker' && !form.workerId) e.workerId = 'Select a worker'
    if (assignTo === 'company' && !form.companyId) e.companyId = 'Select a company'
    if (!form.projectId) e.projectId = 'Select a project'
    if (!form.startDate) e.startDate = 'Start date is required'
    if (!form.endDate) e.endDate = 'End date is required'
    if (!form.paymentType) e.paymentType = 'Payment type is required'
    if (!form.value) e.value = 'Contract value is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await contractService.create({
        workerId: assignTo === 'worker' ? form.workerId || undefined : undefined,
        companyId: assignTo === 'company' ? form.companyId || undefined : undefined,
        projectId: form.projectId,
        startDate: form.startDate,
        endDate: form.endDate,
        paymentType: form.paymentType,
        value: Number(form.value),
      })
      navigate('/hr/register-payment')
    } catch (err: any) {
      setErrors({ submit: err.response?.data?.error || 'Error creating contract' })
    } finally {
      setLoading(false)
    }
  }

  const workerOptions = workers.map(w => ({ value: w.id, label: `${w.name} — ${w.role}` }))
  const companyOptions = companies.map(c => ({ value: c.id, label: `${c.name} (EIN: ${c.ein})` }))
  const projectOptions = projects.map(p => ({ value: p.id, label: p.name }))

  return (
    <div className="max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/hr')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
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
            <button onClick={() => setAssignTo('worker')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${assignTo === 'worker' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              Individual Worker
            </button>
            <button onClick={() => setAssignTo('company')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${assignTo === 'company' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              Company
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">

            {/* Worker or Company selector */}
            {assignTo === 'worker' ? (
              <div className="col-span-2">
                <FormField label="Worker" required error={errors.workerId}>
                  <Select options={workerOptions} placeholder="Select worker..."
                    value={form.workerId} onChange={e => set('workerId', e.target.value)} error={!!errors.workerId} />
                </FormField>
              </div>
            ) : (
              <div className="col-span-2">
                <FormField label="Company" required error={errors.companyId}>
                  <Select options={companyOptions}
                    placeholder={companies.length ? 'Select company...' : 'No companies yet — add one from HR'}
                    value={form.companyId} onChange={e => set('companyId', e.target.value)} error={!!errors.companyId} />
                </FormField>
              </div>
            )}

            {/* Project */}
            <div className="col-span-2">
              <FormField label="Project" required error={errors.projectId}>
                <Select options={projectOptions}
                  placeholder={projects.length ? 'Select project...' : 'No projects created yet...'}
                  value={form.projectId} onChange={e => set('projectId', e.target.value)} error={!!errors.projectId} />
              </FormField>
            </div>

            <FormField label="Start Date" required error={errors.startDate}>
              <Input type="date" value={form.startDate}
                onChange={e => set('startDate', e.target.value)} error={!!errors.startDate} />
            </FormField>

            <FormField label="End Date" required error={errors.endDate}>
              <Input type="date" value={form.endDate}
                onChange={e => set('endDate', e.target.value)} error={!!errors.endDate} />
            </FormField>

            <FormField label="Payment Type" required error={errors.paymentType}>
              <Select options={PAYMENT_TYPES} placeholder="Select type..."
                value={form.paymentType} onChange={e => set('paymentType', e.target.value)} error={!!errors.paymentType} />
            </FormField>

            <FormField label="Contract Value ($)" required error={errors.value}>
              <Input type="number" min="0" step="0.01" placeholder="0.00"
                value={form.value} onChange={e => set('value', e.target.value)} error={!!errors.value} />
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
          <Button onClick={handleSubmit} disabled={loading}>
            <FileText size={16} /> {loading ? 'Saving...' : 'Save Contract'}
          </Button>
        </div>
      </div>
    </div>
  )
}