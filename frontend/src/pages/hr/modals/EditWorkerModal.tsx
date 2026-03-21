import { useState } from 'react'
import { X, Pencil } from 'lucide-react'
import { workerService, type Worker } from '../../../services/workerService'
import { type Company } from '../../../services/companyService'
import { US_STATES, ROLES, WORKER_TYPES, WORK_AUTH } from '../hrConstants'
import type { WorkerDetail } from '../hrTypes'
import Button from '../../../components/ui/Button'
import FormField from '../../../components/ui/FormField'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import { APP_CONFIG } from '../../../config'

type Props = {
    worker: WorkerDetail
    companies: Company[]
    onClose: () => void
    onSaved: (updated: Worker) => void
}

export default function EditWorkerModal({ worker, companies, onClose, onSaved }: Props) {
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

    const set = (k: string, v: string) => {
        setForm(p => ({ ...p, [k]: v }))
        setErrors(p => ({ ...p, [k]: '' }))
    }

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
        { value: '', label: `None (${APP_CONFIG.name} direct employee)` },
        ...companies.map(c => ({ value: c.id, label: `${c.name} (EIN: ${c.ein})` })),
    ]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
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
                    <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                    {/* Personal Information */}
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

                    {/* Work Information */}
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

                    {/* Emergency Contact */}
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

                    {errors.submit && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
                            {errors.submit}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} loading={saving}>
                        <Pencil size={14} /> Save Changes
                    </Button>
                </div>

            </div>
        </div>
    )
}