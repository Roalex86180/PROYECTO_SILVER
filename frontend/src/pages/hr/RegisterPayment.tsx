import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CreditCard, User, Building2, Paperclip, X, FileText } from 'lucide-react'
import FormField from '../../components/ui/FormField'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import { workerService, type Worker } from '../../services/workerService'
import { companyService, type Company } from '../../services/companyService'
import { contractService, type Contract } from '../../services/contractService'
import { paymentService } from '../../services/paymentService'
import api from '../../services/api'

const CONCEPTS = [
  { value: 'Advance',         label: 'Advance'         },
  { value: 'Partial Payment', label: 'Partial Payment' },
  { value: 'Final Payment',   label: 'Final Payment'   },
  { value: 'Bonus',           label: 'Bonus'           },
  { value: 'Other',           label: 'Other'           },
]

const METHODS = [
  { value: 'Bank Transfer', label: 'Bank Transfer' },
  { value: 'Check',         label: 'Check'         },
  { value: 'Cash',          label: 'Cash'          },
  { value: 'Zelle',         label: 'Zelle'         },
  { value: 'ACH',           label: 'ACH'           },
]

export default function RegisterPayment() {
  const navigate  = useNavigate()
  const fileRef   = useRef<HTMLInputElement>(null)

  const [payTo,       setPayTo]       = useState<'worker' | 'company'>('worker')
  const [loading,     setLoading]     = useState(false)
  const [uploading,   setUploading]   = useState(false)
  const [workers,     setWorkers]     = useState<Worker[]>([])
  const [companies,   setCompanies]   = useState<Company[]>([])
  const [contracts,   setContracts]   = useState<Contract[]>([])
  const [filtered,    setFiltered]    = useState<Contract[]>([])
  const [errors,      setErrors]      = useState<Record<string, string>>({})
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptUrl,  setReceiptUrl]  = useState<string>('')
  const [previewUrl,  setPreviewUrl]  = useState<string>('')

  const [form, setForm] = useState({
    workerId:   '',
    companyId:  '',
    contractId: '',
    concept:    '',
    amount:     '',
    date:       new Date().toISOString().split('T')[0],
    method:     '',
    notes:      '',
  })

  useEffect(() => {
    workerService.getAll().then(setWorkers)
    companyService.getAll().then(setCompanies)
    contractService.getAll().then(setContracts)
  }, [])

  const handlePayToChange = (type: 'worker' | 'company') => {
    setPayTo(type)
    setForm(p => ({ ...p, workerId: '', companyId: '', contractId: '' }))
    setFiltered([])
    setErrors({})
  }

  const set = (field: string, value: string) => {
    setForm(p => ({ ...p, [field]: value }))
    setErrors(p => ({ ...p, [field]: '' }))
    if (field === 'workerId')  setForm(p => ({ ...p, workerId:  value, contractId: '' }))
    if (field === 'companyId') setForm(p => ({ ...p, companyId: value, contractId: '' }))
    if (field === 'workerId')  setFiltered(contracts.filter(c => c.workerId  === value))
    if (field === 'companyId') setFiltered(contracts.filter(c => c.companyId === value))
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setPreviewUrl('')
    }
    setReceiptFile(file)

    // Upload immediately
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/uploads/receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setReceiptUrl(res.data.url)
    } catch (err) {
      setErrors(p => ({ ...p, receipt: 'Error uploading file, try again' }))
      setReceiptFile(null)
      setPreviewUrl('')
    } finally {
      setUploading(false)
    }
  }

  const removeFile = () => {
    setReceiptFile(null)
    setReceiptUrl('')
    setPreviewUrl('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (payTo === 'worker'  && !form.workerId)  e.workerId  = 'Select a worker'
    if (payTo === 'company' && !form.companyId) e.companyId = 'Select a company'
    if (!form.contractId) e.contractId = 'Select a contract'
    if (!form.concept)    e.concept    = 'Select a concept'
    if (!form.amount)     e.amount     = 'Amount is required'
    if (!form.date)       e.date       = 'Date is required'
    if (!form.method)     e.method     = 'Payment method is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await paymentService.create({
        contractId: form.contractId,
        concept:    form.concept,
        amount:     Number(form.amount),
        date:       form.date,
        method:     form.method,
        notes:      form.notes,
        receiptUrl: receiptUrl || undefined,
      })
      navigate('/hr')
    } catch (err: any) {
      setErrors({ submit: err.response?.data?.error || 'Error registering payment' })
    } finally {
      setLoading(false)
    }
  }

  const workerOptions   = workers.map(w => ({ value: w.id, label: w.name }))
  const companyOptions  = companies.map(c => ({ value: c.id, label: `${c.name} (EIN: ${c.ein})` }))
  const contractOptions = filtered.map(c => ({
    value: c.id,
    label: `${c.project?.name ?? c.projectId} — $${Number(c.value).toLocaleString('en-US')} (${c.paymentType})`
  }))

  const entitySelected = payTo === 'worker' ? form.workerId : form.companyId

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/hr')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={18} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Register Payment</h1>
          <p className="text-sm text-gray-500">Record a payment for a worker or company contract</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">

        {/* Pay To toggle */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pay To</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handlePayToChange('worker')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                payTo === 'worker' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
              }`}>
              <User size={16} /> Worker / Individual
            </button>
            <button onClick={() => handlePayToChange('company')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                payTo === 'company' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
              }`}>
              <Building2 size={16} /> Company / Subcontractor
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">

          {/* Worker or Company selector */}
          <div className="col-span-2">
            {payTo === 'worker' ? (
              <FormField label="Worker" required error={errors.workerId}>
                <Select options={workerOptions} placeholder="Select worker..." value={form.workerId}
                  onChange={e => set('workerId', e.target.value)} error={!!errors.workerId} />
              </FormField>
            ) : (
              <FormField label="Company" required error={errors.companyId}>
                <Select options={companyOptions} placeholder="Select company..." value={form.companyId}
                  onChange={e => set('companyId', e.target.value)} error={!!errors.companyId} />
              </FormField>
            )}
          </div>

          {/* Contract */}
          <div className="col-span-2">
            <FormField label="Contract" required error={errors.contractId}>
              <Select options={contractOptions}
                placeholder={entitySelected ? 'Select contract...' : `Select a ${payTo} first...`}
                value={form.contractId} onChange={e => set('contractId', e.target.value)}
                error={!!errors.contractId} disabled={!entitySelected} />
            </FormField>
          </div>

          <FormField label="Concept" required error={errors.concept}>
            <Select options={CONCEPTS} placeholder="Select concept..." value={form.concept}
              onChange={e => set('concept', e.target.value)} error={!!errors.concept} />
          </FormField>

          <FormField label="Amount ($)" required error={errors.amount}>
            <Input type="number" min="0" step="0.01" placeholder="0.00"
              value={form.amount} onChange={e => set('amount', e.target.value)} error={!!errors.amount} />
          </FormField>

          <FormField label="Date" required error={errors.date}>
            <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} error={!!errors.date} />
          </FormField>

          <FormField label="Payment Method" required error={errors.method}>
            <Select options={METHODS} placeholder="Select method..." value={form.method}
              onChange={e => set('method', e.target.value)} error={!!errors.method} />
          </FormField>

          <div className="col-span-2">
            <FormField label="Notes (optional)">
              <Input placeholder="Any additional notes..." value={form.notes}
                onChange={e => set('notes', e.target.value)} />
            </FormField>
          </div>

          {/* Receipt Upload */}
          <div className="col-span-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Receipt / Proof of Payment <span className="text-gray-300 font-normal normal-case">(optional)</span>
            </p>

            {!receiptFile ? (
              <button onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl py-6 flex flex-col items-center gap-2 text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-all">
                <Paperclip size={20} />
                <p className="text-sm font-medium">Click to attach receipt</p>
                <p className="text-xs">JPG, PNG, WEBP or PDF — max 10 MB</p>
              </button>
            ) : (
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {receiptFile.type.startsWith('image/') 
                      ? <Paperclip size={16} className="text-blue-500" />
                      : <FileText size={16} className="text-red-500" />
                    }
                    <span className="text-sm font-medium text-gray-700 truncate max-w-xs">{receiptFile.name}</span>
                    {uploading && <span className="text-xs text-blue-500 animate-pulse">Uploading...</span>}
                    {receiptUrl && !uploading && <span className="text-xs text-green-600">✓ Uploaded</span>}
                  </div>
                  <button onClick={removeFile} className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                    <X size={14} />
                  </button>
                </div>
                {previewUrl && (
                  <img src={previewUrl} alt="Receipt preview"
                    className="w-full max-h-48 object-contain rounded-lg border border-gray-100" />
                )}
              </div>
            )}

            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden" onChange={handleFileChange} />

            {errors.receipt && (
              <p className="text-xs text-red-500 mt-1">{errors.receipt}</p>
            )}
          </div>

        </div>

        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mt-4">
            {errors.submit}
          </div>
        )}

        <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={() => navigate('/hr')}>
            <ArrowLeft size={16} /> Back
          </Button>
          <Button onClick={handleSubmit} loading={loading} disabled={uploading}>
            <CreditCard size={16} /> {uploading ? 'Uploading...' : 'Register Payment'}
          </Button>
        </div>
      </div>
    </div>
  )
}