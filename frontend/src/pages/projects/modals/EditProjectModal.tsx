import { useState } from 'react'
import { FolderKanban, X, Pencil } from 'lucide-react'
import { projectService } from '../../../services/projectService'
import type { ProjectDetail } from '../projectTypes'
import Button from '../../../components/ui/Button'

export default function EditProjectModal({ project, onClose, onSaved }: {
    project: ProjectDetail
    onClose: () => void
    onSaved: (updated: ProjectDetail) => void
}) {
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState({
        name: project.name || '',
        description: project.description || '',
        clientContact: project.clientContact || '',
        location: project.location || '',
        status: project.status || 'active',
        startDate: project.startDate ? project.startDate.slice(0, 10) : '',
        endDate: project.endDate ? project.endDate.slice(0, 10) : '',
        budget: project.budget != null ? String(project.budget) : '',
    })

    const set = (k: string, v: string) => { setForm(p => ({ ...p, [k]: v })); setError('') }

    const handleSave = async () => {
        if (!form.name.trim()) { setError('Project name is required'); return }
        setSaving(true)
        try {
            const payload: any = {
                name: form.name,
                description: form.description || undefined,
                clientContact: form.clientContact || undefined,
                location: form.location || undefined,
                status: form.status,
                startDate: form.startDate || undefined,
                endDate: form.endDate || undefined,
                budget: form.budget ? parseFloat(form.budget) : undefined,
            }
            await projectService.update(project.id, payload)
            onSaved({ ...project, ...payload })
        } catch (e: any) {
            setError(e.response?.data?.error || 'Error updating project')
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
                onChange={e => set(key, e.target.value)}
            />
        </div>
    )

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                            <FolderKanban size={16} className="text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-900">Edit Project</h2>
                            <p className="text-xs text-gray-400">{project.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">{field('Project Name', 'name', { placeholder: "McDonald's #245", required: true })}</div>
                        {field('Client Contact', 'clientContact', { placeholder: 'John Smith' })}
                        {field('Location', 'location', { placeholder: 'Miami, FL' })}
                        <div className="col-span-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Description</label>
                            <textarea
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                rows={3}
                                placeholder="Brief project description..."
                                value={form.description}
                                onChange={e => set('description', e.target.value)}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Status</label>
                            <select
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                value={form.status}
                                onChange={e => set('status', e.target.value)}
                            >
                                <option value="active">Active</option>
                                <option value="paused">Paused</option>
                                <option value="completed">Completed</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                        {field('Start Date', 'startDate', { type: 'date' })}
                        {field('End Date', 'endDate', { type: 'date' })}
                        <div className="col-span-2">{field('Budget (USD)', 'budget', { placeholder: '50000', type: 'number' })}</div>
                    </div>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} loading={saving}><Pencil size={14} /> Save Changes</Button>
                </div>

            </div>
        </div>
    )
}