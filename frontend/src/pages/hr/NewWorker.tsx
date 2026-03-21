import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, UserPlus } from 'lucide-react'
import StepIndicator from '../../components/ui/StepIndicator'
import FormField from '../../components/ui/FormField'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import { workerService, type CreateWorkerDto } from '../../services/workerService'
import { companyService, type Company } from '../../services/companyService'
import { APP_CONFIG } from '../../config'

const STEPS = [
  { number: 1, label: 'Personal Info' },
  { number: 2, label: 'Work Info' },
  { number: 3, label: 'Emergency Contact' },
]

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire',
  'New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio',
  'Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota',
  'Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia',
  'Wisconsin','Wyoming'
].map(s => ({ value: s, label: s }))

const ROLES = [
  'Electrician','Plumber','Carpenter','Painter','Installer',
  'Supervisor','General Helper','Mason','Other'
].map(r => ({ value: r, label: r }))

const WORKER_TYPES = [
  { value: 'W-2 Employee',    label: 'W-2 Employee'    },
  { value: '1099 Contractor', label: '1099 Contractor' },
  { value: 'Subcontractor',   label: 'Subcontractor'   },
]

const WORK_AUTH = [
  { value: 'US Citizen',         label: 'US Citizen'                        },
  { value: 'Permanent Resident', label: 'Permanent Resident (Green Card)'   },
  { value: 'Work Visa',          label: 'Work Visa (H-2B / H-1B)'           },
  { value: 'EAD',                label: 'Employment Authorization (EAD)'    },
  { value: 'TN Visa',            label: 'TN Visa (Canada/Mexico)'           },
]

export default function NewWorker() {
  const navigate = useNavigate()
  const [step,      setStep]      = useState(1)
  const [loading,   setLoading]   = useState(false)
  const [errors,    setErrors]    = useState<Record<string, string>>({})
  const [companies, setCompanies] = useState<Company[]>([])

  const [form, setForm] = useState<CreateWorkerDto>({
    name: '', ssn: '', ein: '', phone: '', email: '',
    address: '', state: '', workAuthorization: '',
    role: '', type: '', companyId: '',
    emergencyContact: '', emergencyPhone: '',
  })

  useEffect(() => {
    companyService.getAll().then(setCompanies)
  }, [])

  const set = (field: keyof CreateWorkerDto, value: string) => {
    setForm(p => ({ ...p, [field]: value }))
    setErrors(p => ({ ...p, [field]: '' }))
  }

  const validateStep1 = () => {
    const e: Record<string, string> = {}
    if (!form.name)  e.name  = 'Full name is required'
    if (!form.ssn)   e.ssn   = 'SSN is required'
    if (form.ssn && !/^\d{3}-\d{2}-\d{4}$/.test(form.ssn))
                     e.ssn   = 'Format must be XXX-XX-XXXX'
    if (!form.phone)   e.phone   = 'Phone is required'
    if (!form.address) e.address = 'Address is required'
    if (!form.state)   e.state   = 'State is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep2 = () => {
    const e: Record<string, string> = {}
    if (!form.role)              e.role              = 'Role is required'
    if (!form.type)              e.type              = 'Worker type is required'
    if (!form.workAuthorization) e.workAuthorization = 'Work authorization is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await workerService.create({
        name:              form.name,
        ssn:               form.ssn,
        ein:               form.ein              || undefined,
        phone:             form.phone            || undefined,
        email:             form.email            || undefined,
        address:           form.address          || undefined,
        state:             form.state            || undefined,
        workAuthorization: form.workAuthorization,
        role:              form.role,
        type:              form.type,
        companyId:         form.companyId        || undefined,
        emergencyContact:  form.emergencyContact || undefined,
        emergencyPhone:    form.emergencyPhone   || undefined,
      })
      navigate('/hr/new-contract', { state: { fromNewWorker: true } })
    } catch (err: any) {
      setErrors({ submit: err.response?.data?.error || 'Error creating worker' })
    } finally {
      setLoading(false)
    }
  }

  const companyOptions = [
    { value: '', label: `None (${APP_CONFIG.name} direct employee)` },
    ...companies.map(c => ({ value: c.id, label: `${c.name} (EIN: ${c.ein})` })),
  ]

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
          <h1 className="text-xl font-bold text-gray-900">New Worker</h1>
          <p className="text-sm text-gray-500">Register a new employee or contractor</p>
        </div>
      </div>

      <StepIndicator steps={STEPS} current={step} />

      <div className="bg-white rounded-xl border border-gray-200 p-6">

        {/* STEP 1: Personal Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-800 mb-4">Personal Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <FormField label="Full Name" required error={errors.name}>
                  <Input
                    placeholder="John Smith"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    error={!!errors.name}
                  />
                </FormField>
              </div>
              <FormField label="SSN" required error={errors.ssn}>
                <Input
                  placeholder="XXX-XX-XXXX"
                  value={form.ssn}
                  onChange={e => set('ssn', e.target.value)}
                  error={!!errors.ssn}
                  maxLength={11}
                />
              </FormField>
              <FormField label="EIN (if applicable)" error={errors.ein}>
                <Input
                  placeholder="XX-XXXXXXX"
                  value={form.ein}
                  onChange={e => set('ein', e.target.value)}
                />
              </FormField>
              <FormField label="Phone" required error={errors.phone}>
                <Input
                  placeholder="+1 (555) 000-0000"
                  value={form.phone || ''}
                  onChange={e => set('phone', e.target.value)}
                  error={!!errors.phone}
                />
              </FormField>
              <FormField label="Email" error={errors.email}>
                <Input
                  type="email"
                  placeholder="john@email.com"
                  value={form.email || ''}
                  onChange={e => set('email', e.target.value)}
                />
              </FormField>
              <div className="col-span-2">
                <FormField label="Address" required error={errors.address}>
                  <Input
                    placeholder="123 Main St, City"
                    value={form.address || ''}
                    onChange={e => set('address', e.target.value)}
                    error={!!errors.address}
                  />
                </FormField>
              </div>
              <FormField label="State" required error={errors.state}>
                <Select
                  options={US_STATES}
                  placeholder="Select state..."
                  value={form.state || ''}
                  onChange={e => set('state', e.target.value)}
                  error={!!errors.state}
                />
              </FormField>
            </div>
          </div>
        )}

        {/* STEP 2: Work Info */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-800 mb-4">Work Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Role" required error={errors.role}>
                <Select
                  options={ROLES}
                  placeholder="Select role..."
                  value={form.role}
                  onChange={e => set('role', e.target.value)}
                  error={!!errors.role}
                />
              </FormField>
              <FormField label="Worker Type" required error={errors.type}>
                <Select
                  options={WORKER_TYPES}
                  placeholder="Select type..."
                  value={form.type}
                  onChange={e => set('type', e.target.value)}
                  error={!!errors.type}
                />
              </FormField>
              <div className="col-span-2">
                <FormField label="Work Authorization" required error={errors.workAuthorization}>
                  <Select
                    options={WORK_AUTH}
                    placeholder="Select authorization..."
                    value={form.workAuthorization}
                    onChange={e => set('workAuthorization', e.target.value)}
                    error={!!errors.workAuthorization}
                  />
                </FormField>
              </div>
              <div className="col-span-2">
                <FormField
                  label="Company (if applicable)"
                  error={errors.companyId}
                >
                  <Select
                    options={companyOptions}
                    placeholder="Select company..."
                    value={form.companyId || ''}
                    onChange={e => set('companyId', e.target.value)}
                  />
                </FormField>
                <p className="text-xs text-gray-400 mt-1">
                  Leave as "None" if this worker belongs directly to {APP_CONFIG.name}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Emergency Contact */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-800 mb-4">Emergency Contact</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <FormField label="Contact Name" error={errors.emergencyContact}>
                  <Input
                    placeholder="Jane Smith"
                    value={form.emergencyContact || ''}
                    onChange={e => set('emergencyContact', e.target.value)}
                  />
                </FormField>
              </div>
              <FormField label="Contact Phone" error={errors.emergencyPhone}>
                <Input
                  placeholder="+1 (555) 000-0000"
                  value={form.emergencyPhone || ''}
                  onChange={e => set('emergencyPhone', e.target.value)}
                />
              </FormField>
            </div>
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
                {errors.submit}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
          <Button
            variant="secondary"
            onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/hr')}
          >
            <ArrowLeft size={16} /> Back
          </Button>
          {step < 3
            ? <Button onClick={handleNext}>Next <ArrowRight size={16} /></Button>
            : <Button onClick={handleSubmit} loading={loading}>
                <UserPlus size={16} /> Save Worker
              </Button>
          }
        </div>

      </div>
    </div>
  )
}