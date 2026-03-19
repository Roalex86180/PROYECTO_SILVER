export const STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-50 text-green-700 border-green-100',
    completed: 'bg-blue-50 text-blue-700 border-blue-100',
    paused: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    archived: 'bg-gray-50 text-gray-500 border-gray-200',
}

export const STATUS_LABELS: Record<string, string> = {
    active: 'Active',
    paused: 'Paused',
    completed: 'Completed',
    archived: 'Archived',
}

export const fmt = (n?: number | null) =>
    n !== undefined && n !== null ? '$' + n.toLocaleString('en-US') : '—'

export const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

export const progressColor = (p: number) =>
    p >= 80 ? 'bg-green-500' : p >= 40 ? 'bg-blue-500' : 'bg-yellow-400'