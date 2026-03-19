import { useState } from 'react'
import { X } from 'lucide-react'
import Button from '../../../components/ui/Button'

export default function NewProjectForm({ onSave, onCancel }: {
    onSave: (data: any) => Promise<void>
    onCancel: () => void
}) {
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState({
        name: '', description: '', client: '', clientContact: '',
        location: '', startDate: '', endDate: '', budget: '', status: 'active',
    })

    const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

    const handleSave = async () => {
        if (!form.name.trim()) { setError('Project name is required'); return }
        setSaving(true)
        try {
            await onSave({ ...form, budget: form.budget ? parseFloat(form.budget) : undefined })
        } catch (e: any) {
            setError(e.response?.data?.error || 'Error creating project')
            setSaving(false)
        }
    }

    const field = (label: string, key: string, opts?: { placeholder?: string; type?: string; required?: boolean }) => (
        <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                {label} {opts?.required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={opts?.type ?? 'text'}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={opts?.placeholder ?? ''}
                value={(form as any)[key]}
                onChange={e => { set(key, e.target.value); setError('') }}
            />
        </div>
    )

    return (
        <div className="bg-white rounded-xl border border-blue-200 p-4 md:p-5 mb-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-800">New Project</h2>
                <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                {field('Project Name', 'name', { placeholder: "McDonald's #245", required: true })}
                {field('Client', 'client', { placeholder: 'Acme Corp' })}
            </div>
            <div className="mb-3">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Description</label>
                <textarea
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                    placeholder="Brief project description..."
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                {field('Location', 'location', { placeholder: 'Miami, FL' })}
                {field('Client Contact', 'clientContact', { placeholder: 'John Smith' })}
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Status</label>
                    <select
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={form.status}
                        onChange={e => set('status', e.target.value)}
                    >
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {field('Start Date', 'startDate', { type: 'date' })}
                {field('End Date', 'endDate', { type: 'date' })}
                {field('Budget (USD)', 'budget', { placeholder: '50000', type: 'number' })}
            </div>
            {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
            <div className="flex gap-2 mt-4">
                <Button onClick={handleSave} loading={saving}>Save Project</Button>
                <Button variant="secondary" onClick={onCancel}>Cancel</Button>
            </div>
        </div>
    )
}