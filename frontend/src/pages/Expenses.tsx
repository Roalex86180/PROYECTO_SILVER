import { useState, useEffect, useRef } from 'react'
import { Plus, Receipt, Search, Pencil, Trash2, Download, X, FolderKanban, Building2, DollarSign, Paperclip, FileText } from 'lucide-react'
import { expenseService, type Expense, type CreateExpenseDto } from '../services/expenseService'
import { projectService } from '../services/projectService'
import { companyService } from '../services/companyService'
import { getDateRanges, getMonthRanges, type DateRange } from '../utils/exportExcel'
import Button from '../components/ui/Button'
import api from '../services/api'
import * as XLSX from 'xlsx'
import { APP_CONFIG } from '../config'

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

// ─── Export Modal (same UI as ExportModal.tsx) ────────────────────────────────

function ExportPeriodModal({ expenses, onClose }: { expenses: Expense[]; onClose: () => void }) {
    const currentYear = new Date().getFullYear()
    const [year, setYear] = useState(currentYear)
    const [rangeMode, setRangeMode] = useState<'period' | 'month' | 'custom'>('period')
    const [selected, setSelected] = useState<string>('Q1')
    const [customFrom, setCustomFrom] = useState('')
    const [customTo, setCustomTo] = useState('')

    const periodRanges = getDateRanges(year)
    const monthRanges = getMonthRanges(year)
    const options = rangeMode === 'month' ? Object.entries(monthRanges) : Object.entries(periodRanges)

    const handleExport = () => {
        let range: DateRange

        if (rangeMode === 'custom') {
            if (!customFrom || !customTo) return
            range = {
                label: `${customFrom}_to_${customTo}`,
                from: new Date(customFrom),
                to: new Date(customTo)
            }
        } else if (rangeMode === 'month') {
            range = monthRanges[selected]
        } else {
            range = periodRanges[selected]
        }

        const filtered = expenses.filter(e => {
            const d = new Date(e.date)
            return d >= range.from && d <= range.to
        })

        const rows = filtered.map(e => ({
            Date: fmtDate(e.date),
            Description: e.description,
            Category: e.category,
            Amount: Number(e.amount),
            'Payment Method': e.paymentMethod ?? '',
            Project: e.project?.name ?? '',
            Contractor: e.company?.name ?? '',
            Notes: e.notes ?? '',
            Receipt: e.receiptUrl ?? '',
        }))

        // Subtotal row
        const total = filtered.reduce((s, e) => s + Number(e.amount), 0)
        rows.push({
            Date: '',
            Description: 'TOTAL',
            Category: '',
            Amount: total,
            'Payment Method': '',
            Project: '',
            Contractor: '',
            Notes: '',
            Receipt: '',
        })

        const ws = XLSX.utils.json_to_sheet(rows)

        // Format Amount column as currency
        const r = XLSX.utils.decode_range(ws['!ref'] ?? 'A1')
        for (let i = 1; i <= r.e.r; i++) {
            const cell = ws[XLSX.utils.encode_cell({ r: i, c: 3 })]
            if (cell && typeof cell.v === 'number') cell.z = '$#,##0.00'
        }

        ws['!cols'] = [
            { wch: 15 }, { wch: 35 }, { wch: 18 }, { wch: 14 },
            { wch: 16 }, { wch: 22 }, { wch: 22 }, { wch: 25 }, { wch: 30 }
        ]

        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Expenses')
        XLSX.writeFile(wb, `${APP_CONFIG.name}_Expenses_${range.label.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`)
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">

                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-base font-bold text-gray-900">Export to Excel</h2>
                        <p className="text-xs text-gray-400 mt-0.5">{APP_CONFIG.name} Expenses Report</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={16} className="text-gray-500" />
                    </button>
                </div>

                {/* Year selector */}
                <div className="mb-4">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Year</label>
                    <select
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={year} onChange={e => setYear(Number(e.target.value))}>
                        {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>

                {/* Range mode tabs */}
                <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-4">
                    {(['period', 'month', 'custom'] as const).map(m => (
                        <button key={m}
                            onClick={() => { setRangeMode(m); setSelected(m === 'month' ? 'January' : 'Q1') }}
                            className={`flex-1 py-1.5 rounded-md text-xs font-medium capitalize transition-colors
                                ${rangeMode === m ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            {m === 'period' ? 'Quarter/Semi/Annual' : m === 'month' ? 'Monthly' : 'Custom Range'}
                        </button>
                    ))}
                </div>

                {/* Options */}
                {rangeMode !== 'custom' ? (
                    <div className="grid grid-cols-2 gap-2 mb-5">
                        {options.map(([key, range]) => (
                            <button key={key} onClick={() => setSelected(key)}
                                className={`px-3 py-2.5 rounded-lg text-sm border text-left transition-colors
                                    ${selected === key
                                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                                        : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                                {range.label}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 mb-5">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">From</label>
                            <input type="date"
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">To</label>
                            <input type="date"
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={customTo} onChange={e => setCustomTo(e.target.value)} />
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex gap-2">
                    <button onClick={onClose}
                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleExport}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                        <Download size={14} /> Download Excel
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Expense Form Modal ───────────────────────────────────────────────────────

function ExpenseModal({ expense, projects, companies, onSave, onClose }: {
    expense?: Expense
    projects: { id: string; name: string }[]
    companies: { id: string; name: string }[]
    onSave: (data: CreateExpenseDto) => Promise<void>
    onClose: () => void
}) {
    const fileRef = useRef<HTMLInputElement>(null)
    const [form, setForm] = useState({
        description: expense?.description ?? '',
        amount: expense?.amount ? String(expense.amount) : '',
        date: expense?.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0],
        category: expense?.category ?? '',
        paymentMethod: expense?.paymentMethod ?? '',
        notes: expense?.notes ?? '',
        projectId: expense?.projectId ?? '',
        companyId: expense?.companyId ?? '',
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [receiptFile, setReceiptFile] = useState<File | null>(null)
    const [receiptUrl, setReceiptUrl] = useState<string>(expense?.receiptUrl ?? '')
    const [previewUrl, setPreviewUrl] = useState<string>('')
    const [uploading, setUploading] = useState(false)

    const set = (k: string, v: string) => { setForm(f => ({ ...f, [k]: v })); setError('') }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.type.startsWith('image/')) setPreviewUrl(URL.createObjectURL(file))
        else setPreviewUrl('')
        setReceiptFile(file)
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            const res = await api.post('/uploads/receipt', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setReceiptUrl(res.data.url)
        } catch {
            setError('Error uploading file, try again')
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

    const handleSave = async () => {
        if (!form.description.trim() || !form.amount || !form.date) {
            setError('Description, amount and date are required')
            return
        }
        setSaving(true)
        try {
            await onSave({
                description: form.description,
                amount: parseFloat(form.amount),
                date: form.date,
                category: form.category || 'General',
                paymentMethod: form.paymentMethod || undefined,
                notes: form.notes || undefined,
                receiptUrl: receiptUrl || undefined,
                projectId: form.projectId || undefined,
                companyId: form.companyId || undefined,
            })
            onClose()
        } catch {
            setError('Error saving expense')
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-lg flex flex-col max-h-[95vh]">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                            <Receipt size={16} className="text-orange-500" />
                        </div>
                        <h2 className="text-sm font-bold text-gray-900">{expense ? 'Edit Expense' : 'New Expense'}</h2>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
                        <X size={15} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Description *</label>
                        <input className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                            placeholder="e.g. Flight to Miami" value={form.description} onChange={e => set('description', e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Amount (USD) *</label>
                            <input type="number" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                                placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Date *</label>
                            <input type="date" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                                value={form.date} onChange={e => set('date', e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Category</label>
                            <input className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                                placeholder="Flight, Hotel, Food..." value={form.category} onChange={e => set('category', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Payment Method</label>
                            <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                                value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)}>
                                <option value="">Select...</option>
                                <option>Cash</option>
                                <option>Credit Card</option>
                                <option>Debit Card</option>
                                <option>Transfer</option>
                                <option>Check</option>
                                <option>Zelle</option>
                                <option>ACH</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                            Associate to Project <span className="text-gray-300 font-normal">(optional)</span>
                        </label>
                        <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                            value={form.projectId} onChange={e => set('projectId', e.target.value)}>
                            <option value="">No project</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                            Associate to Contractor <span className="text-gray-300 font-normal">(optional)</span>
                        </label>
                        <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                            value={form.companyId} onChange={e => set('companyId', e.target.value)}>
                            <option value="">No contractor</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Notes</label>
                        <textarea className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                            rows={2} placeholder="Additional notes..." value={form.notes} onChange={e => set('notes', e.target.value)} />
                    </div>

                    {/* Receipt Upload */}
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Receipt <span className="text-gray-300 font-normal normal-case">(optional)</span>
                        </p>
                        {!receiptFile && !receiptUrl ? (
                            <button onClick={() => fileRef.current?.click()}
                                className="w-full border-2 border-dashed border-gray-200 rounded-xl py-5 flex flex-col items-center gap-2 text-gray-400 hover:border-orange-300 hover:text-orange-400 transition-all">
                                <Paperclip size={18} />
                                <p className="text-sm font-medium">Click to attach receipt</p>
                                <p className="text-xs">JPG, PNG, WEBP or PDF — max 10 MB</p>
                            </button>
                        ) : (
                            <div className="border border-gray-200 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {receiptFile?.type.startsWith('image/') || receiptUrl?.match(/\.(jpg|jpeg|png|webp)/i)
                                            ? <Paperclip size={15} className="text-orange-400" />
                                            : <FileText size={15} className="text-red-400" />
                                        }
                                        <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                                            {receiptFile?.name ?? 'Existing receipt'}
                                        </span>
                                        {uploading && <span className="text-xs text-blue-500 animate-pulse">Uploading...</span>}
                                        {receiptUrl && !uploading && <span className="text-xs text-green-600">✓ Uploaded</span>}
                                    </div>
                                    <button onClick={removeFile} className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100">
                                        <X size={13} />
                                    </button>
                                </div>
                                {previewUrl && (
                                    <img src={previewUrl} alt="Receipt preview"
                                        className="w-full max-h-40 object-contain rounded-lg border border-gray-100" />
                                )}
                                {receiptUrl && !previewUrl && receiptUrl.match(/\.(jpg|jpeg|png|webp)/i) && (
                                    <img src={receiptUrl} alt="Receipt"
                                        className="w-full max-h-40 object-contain rounded-lg border border-gray-100" />
                                )}
                            </div>
                        )}
                        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
                            className="hidden" onChange={handleFileChange} />
                    </div>

                    {error && <p className="text-xs text-red-500">{error}</p>}
                </div>

                <div className="flex gap-2 justify-end p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving || uploading}>
                        {uploading ? 'Uploading...' : saving ? 'Saving...' : 'Save Expense'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Expenses() {
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
    const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterProject, setFilterProject] = useState('')
    const [filterCompany, setFilterCompany] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [showExport, setShowExport] = useState(false)
    const [editing, setEditing] = useState<Expense | null>(null)

    useEffect(() => {
        Promise.all([
            expenseService.getAll(),
            projectService.getAll(),
            companyService.getAll(),
        ]).then(([e, p, c]) => {
            setExpenses(e)
            setProjects(p)
            setCompanies(c)
        }).finally(() => setLoading(false))
    }, [])

    const filtered = expenses.filter(e => {
        const matchSearch = e.description.toLowerCase().includes(search.toLowerCase()) ||
            e.category.toLowerCase().includes(search.toLowerCase())
        const matchProject = !filterProject || e.projectId === filterProject
        const matchCompany = !filterCompany || e.companyId === filterCompany
        return matchSearch && matchProject && matchCompany
    })

    const totalAll = filtered.reduce((s, e) => s + Number(e.amount), 0)
    const totalByProject = filtered.filter(e => e.projectId).reduce((s, e) => s + Number(e.amount), 0)
    const totalGeneral = filtered.filter(e => !e.projectId && !e.companyId).reduce((s, e) => s + Number(e.amount), 0)

    const handleCreate = async (data: CreateExpenseDto) => {
        const exp = await expenseService.create(data)
        setExpenses(prev => [exp, ...prev])
    }

    const handleUpdate = async (data: CreateExpenseDto) => {
        if (!editing) return
        const exp = await expenseService.update(editing.id, data)
        setExpenses(prev => prev.map(e => e.id === editing.id ? exp : e))
        setEditing(null)
    }

    const handleDelete = async (id: string) => {
        await expenseService.delete(id)
        setExpenses(prev => prev.filter(e => e.id !== id))
    }

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">{APP_CONFIG.name} Expenses</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{expenses.length} expenses registered</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setShowExport(true)}><Download size={14} /> Export</Button>
                    <Button onClick={() => setShowModal(true)}><Plus size={15} /> New Expense</Button>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <DollarSign size={15} className="text-orange-500" />
                        <p className="text-xs text-gray-400">Total Expenses</p>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{fmt(totalAll)}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <FolderKanban size={15} className="text-blue-500" />
                        <p className="text-xs text-gray-400">Project Related</p>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{fmt(totalByProject)}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 col-span-2 md:col-span-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Receipt size={15} className="text-gray-400" />
                        <p className="text-xs text-gray-400">General (no project)</p>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{fmt(totalGeneral)}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                        placeholder="Search by description or category..."
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                    value={filterProject} onChange={e => setFilterProject(e.target.value)}>
                    <option value="">All Projects</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                    value={filterCompany} onChange={e => setFilterCompany(e.target.value)}>
                    <option value="">All Contractors</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-16 text-sm text-gray-400">Loading...</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
                    <Receipt size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400">{search || filterProject || filterCompany ? 'No expenses match your filters' : 'No expenses yet'}</p>
                    {!search && !filterProject && !filterCompany && (
                        <button onClick={() => setShowModal(true)} className="mt-3 text-sm text-orange-500 hover:underline">
                            Add first expense
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(expense => (
                        <div key={expense.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:border-orange-200 transition-colors">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-semibold text-gray-900">{expense.description}</p>
                                        <span className="text-xs bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded-full">
                                            {expense.category}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                                        <span>{fmtDate(expense.date)}</span>
                                        {expense.paymentMethod && <span>{expense.paymentMethod}</span>}
                                        {expense.project && (
                                            <span className="flex items-center gap-1 text-blue-500">
                                                <FolderKanban size={10} /> {expense.project.name}
                                            </span>
                                        )}
                                        {expense.company && (
                                            <span className="flex items-center gap-1 text-purple-500">
                                                <Building2 size={10} /> {expense.company.name}
                                            </span>
                                        )}
                                        {expense.receiptUrl && (
                                            <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-green-500 hover:underline">
                                                <Paperclip size={10} /> Receipt
                                            </a>
                                        )}
                                    </div>
                                    {expense.notes && (
                                        <p className="text-xs text-gray-400 mt-1 italic">{expense.notes}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <p className="text-sm font-bold text-gray-900">{fmt(Number(expense.amount))}</p>
                                    <button onClick={() => setEditing(expense)}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                                        <Pencil size={13} />
                                    </button>
                                    <button onClick={() => handleDelete(expense.id)}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Total footer */}
                    <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 flex items-center justify-between">
                        <span className="text-xs font-semibold text-orange-700">Total shown</span>
                        <span className="text-sm font-bold text-orange-800">{fmt(totalAll)}</span>
                    </div>
                </div>
            )}

            {/* Modals */}
            {showModal && (
                <ExpenseModal projects={projects} companies={companies}
                    onSave={handleCreate} onClose={() => setShowModal(false)} />
            )}
            {editing && (
                <ExpenseModal expense={editing} projects={projects} companies={companies}
                    onSave={handleUpdate} onClose={() => setEditing(null)} />
            )}
            {showExport && (
                <ExportPeriodModal expenses={expenses} onClose={() => setShowExport(false)} />
            )}
        </div>
    )
}