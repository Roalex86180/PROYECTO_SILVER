import { useState } from 'react'
import { FileText, X, Pencil } from 'lucide-react'
import { contractService } from '../../../services/contractService'
import { PAYMENT_TYPES } from '../hrConstants'
import type { ContractFull } from '../hrTypes'
import Button from '../../../components/ui/Button'

type Props = {
    contract: ContractFull
    onClose: () => void
    onSaved: (updated: ContractFull) => void
}

export default function EditContractModal({ contract, onClose, onSaved }: Props) {
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState({
        startDate: contract.startDate ? contract.startDate.slice(0, 10) : '',
        endDate: contract.endDate ? contract.endDate.slice(0, 10) : '',
        paymentType: contract.paymentType || '',
        value: String(contract.value || ''),
    })

    const set = (k: string, v: string) => {
        setForm(p => ({ ...p, [k]: v }))
        setError('')
    }

    const handleSave = async () => {
        if (!form.startDate || !form.endDate || !form.paymentType || !form.value) {
            setError('All fields are required')
            return
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

                {/* Header */}
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

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-3">
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Project</p>
                            <p className="text-xs font-semibold text-gray-700 truncate">{projectName}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                                {contract.worker ? 'Worker' : 'Company'}
                            </p>
                            <p className="text-xs font-semibold text-gray-700 truncate">{entityName}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                                Start Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={form.startDate}
                                onChange={e => set('startDate', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                                End Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={form.endDate}
                                onChange={e => set('endDate', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                                Payment Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                value={form.paymentType}
                                onChange={e => set('paymentType', e.target.value)}
                            >
                                <option value="">Select...</option>
                                {PAYMENT_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                                Value (USD) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={form.value}
                                onChange={e => set('value', e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
                            {error}
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