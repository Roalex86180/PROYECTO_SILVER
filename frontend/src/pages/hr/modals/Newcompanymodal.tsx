import { useState } from 'react'
import { Building2, X, Plus } from 'lucide-react'
import { companyService, type Company } from '../../../services/companyService'
import { US_STATES } from '../hrConstants'
import Button from '../../../components/ui/Button'
import FormField from '../../../components/ui/FormField'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'

type Props = {
    onClose: () => void
    onSaved: (company: Company) => void
}

export default function NewCompanyModal({ onClose, onSaved }: Props) {
    const [saving, setSaving] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [form, setForm] = useState({
        name: '',
        ein: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        state: '',
        notes: '',
    })

    const set = (k: string, v: string) => {
        setForm(p => ({ ...p, [k]: v }))
        setErrors(p => ({ ...p, [k]: '' }))
    }

    const handleSave = async () => {
        const e: Record<string, string> = {}
        if (!form.name.trim()) e.name = 'Required'
        if (!form.ein.trim()) e.ein = 'Required'
        if (Object.keys(e).length > 0) { setErrors(e); return }

        setSaving(true)
        try {
            const created = await companyService.create(form)
            onSaved(created)
            onClose()
        } catch (err: any) {
            setErrors({ submit: err.response?.data?.error || 'Error creating company' })
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Building2 size={16} className="text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-900">New Company</h2>
                            <p className="text-xs text-gray-400">Add a new subcontractor</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                            <FormField label="Company Name" required error={errors.name}>
                                <Input placeholder="Acme Corp" value={form.name} onChange={e => set('name', e.target.value)} error={!!errors.name} />
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

                    {errors.submit && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mt-3">
                            {errors.submit}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        <Plus size={14} /> {saving ? 'Saving...' : 'Create Company'}
                    </Button>
                </div>
            </div>
        </div>
    )
}