import { useState, useEffect, useRef } from 'react'
import { FolderKanban, MapPin, Users, Calendar, ChevronRight, MoreVertical, CheckCircle2, PauseCircle, Archive } from 'lucide-react'
import type { Project } from '../../../services/projectService'
import { STATUS_COLORS, STATUS_LABELS, fmt, fmtDate, progressColor } from '../projectConstants'
import type { TeamMember } from '../projectTypes'

const STATUS_ICON: Record<string, React.ReactNode> = {
    active: <CheckCircle2 size={12} />,
    completed: <CheckCircle2 size={12} />,
    paused: <PauseCircle size={12} />,
    archived: <Archive size={12} />,
}

export default function ProjectCard({ project, onClick, onStatusChange }: {
    project: Project
    onClick: () => void
    onStatusChange: (id: string, status: string) => void
}) {
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const prog = (project as any).progress ?? 0
    const budget = (project as any).budget
    const spent = (project as any).spent
    const client = (project as any).client
    const startDate = (project as any).startDate
    const endDate = (project as any).endDate
    const team: TeamMember[] = (project as any).team ?? []

    return (
        <div
            className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col"
            onClick={onClick}
        >
            <div className="p-4 md:p-5 flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                        <FolderKanban size={16} className="text-blue-600" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 truncate">{project.name}</h3>
                        {client && <p className="text-xs text-gray-400 mt-0.5 truncate">{client}</p>}
                        {project.location && (
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                <MapPin size={10} /> {project.location}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1.5 ml-2 shrink-0" onClick={e => e.stopPropagation()}>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 capitalize ${STATUS_COLORS[project.status] ?? STATUS_COLORS.active}`}>
                        {STATUS_ICON[project.status]}{STATUS_LABELS[project.status] ?? project.status}
                    </span>
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setMenuOpen(v => !v)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
                        >
                            <MoreVertical size={14} />
                        </button>
                        {menuOpen && (
                            <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-40">
                                {['active', 'paused', 'completed', 'archived'].filter(s => s !== project.status).map(s => (
                                    <button key={s}
                                        onClick={() => { onStatusChange(project.id, s); setMenuOpen(false) }}
                                        className="w-full text-left px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 capitalize flex items-center gap-2">
                                        {STATUS_ICON[s]} Mark as {STATUS_LABELS[s]}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {prog > 0 && (
                <div className="px-4 md:px-5 mb-3">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-400">Progress</span>
                        <span className="text-xs font-semibold text-gray-700">{prog}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${progressColor(prog)}`} style={{ width: `${prog}%` }} />
                    </div>
                </div>
            )}

            {(budget || spent) && (
                <div className="px-4 md:px-5 mb-3 flex items-center gap-4">
                    {budget && <div><p className="text-[10px] text-gray-400 uppercase tracking-wide">Budget</p><p className="text-xs font-semibold text-gray-700">{fmt(budget)}</p></div>}
                    {spent !== undefined && <div><p className="text-[10px] text-gray-400 uppercase tracking-wide">Spent</p><p className="text-xs font-semibold text-gray-700">{fmt(spent)}</p></div>}
                    {budget && spent !== undefined && (
                        <div className="ml-auto">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Remaining</p>
                            <p className={`text-xs font-semibold ${budget - spent < 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(budget - spent)}</p>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-auto px-4 md:px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center">
                    {team.slice(0, 4).map((m, i) => (
                        <div key={m.id} title={m.name}
                            style={{ marginLeft: i > 0 ? '-8px' : 0, zIndex: team.length - i }}
                            className="w-6 h-6 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white text-[10px] font-bold relative">
                            {m.name.charAt(0).toUpperCase()}
                        </div>
                    ))}
                    {team.length > 4 && (
                        <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-500 text-[10px] font-bold -ml-2">
                            +{team.length - 4}
                        </div>
                    )}
                    {team.length === 0 && (
                        <span className="text-xs text-gray-300 flex items-center gap-1"><Users size={11} /> No team</span>
                    )}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar size={11} />
                    <span className="hidden sm:inline">
                        {startDate ? fmtDate(startDate) : fmtDate(project.createdAt)}
                        {endDate && <> – {fmtDate(endDate)}</>}
                    </span>
                </div>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
            </div>
        </div>
    )
}