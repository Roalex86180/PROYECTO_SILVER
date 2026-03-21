import { useState, useEffect } from 'react'
import {
  FolderKanban, Search, CheckCircle2, Clock, TrendingUp, BarChart2, Plus
} from 'lucide-react'
import { projectService, type Project } from '../services/projectService'
import { exportProjectExcel } from '../utils/exportExcel'
import Button from '../components/ui/Button'

import type { ProjectDetail } from './projects/projectTypes'
import { fmt, STATUS_LABELS } from './projects/projectConstants'
import StatCard from './projects/components/StatCard'
import ProjectCard from './projects/components/ProjectCard'
import AnalyticsView from './projects/components/AnalyticsView'
import ProjectDetailModal from './projects/modals/ProjectDetailModal'
import NewProjectForm from './projects/modals/NewProjectForm'
import EditProjectModal from './projects/modals/EditProjectModal'

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'projects' | 'analytics'>('projects')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<ProjectDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectDetail | null>(null)

  useEffect(() => {
    projectService.getAll().then(p => { setProjects(p); setLoading(false) })
  }, [])

  const filtered = projects.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      ((p as any).client || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.location || '').toLowerCase().includes(search.toLowerCase())
    return matchSearch && (filter === 'all' || p.status === filter)
  })

  const active = projects.filter(p => p.status === 'active').length
  const completed = projects.filter(p => p.status === 'completed').length
  const totalBudget = projects.reduce((s, p) => s + ((p as any).budget ?? 0), 0)

  const handleCreate = async (data: any) => {
    const np = await projectService.create(data)
    setProjects(p => [np, ...p])
    setShowForm(false)
  }

  const handleStatusChange = async (id: string, status: string) => {
    await projectService.update(id, { status })
    setProjects(p => p.map(pr => pr.id === id ? { ...pr, status } : pr))
    if (selected?.id === id) setSelected(s => s ? { ...s, status } : s)
  }

  const handleCardClick = async (project: Project) => {
    setLoadingDetail(true)
    try {
      const detail = await projectService.getById(project.id)
      setSelected(detail as ProjectDetail)
    } catch {
      setSelected(project as ProjectDetail)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleProjectSaved = (updated: ProjectDetail) => {
    setProjects(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p))
    setSelected(updated)
    setEditingProject(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">{projects.length} projects total</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button onClick={() => setView('projects')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                ${view === 'projects' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <FolderKanban size={13} /> Projects
            </button>
            <button onClick={() => setView('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                ${view === 'analytics' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <BarChart2 size={13} /> Analytics
            </button>
          </div>
          {view === 'projects' && (
            <Button onClick={() => setShowForm(v => !v)}><Plus size={15} /> New Project</Button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard icon={<FolderKanban size={18} />} label="Total Projects" value={String(projects.length)} />
        <StatCard icon={<CheckCircle2 size={18} />} label="Active" value={String(active)} sub={`${completed} completed`} />
        <StatCard icon={<Clock size={18} />} label="Paused" value={String(projects.filter(p => p.status === 'paused').length)} />
        <StatCard icon={<TrendingUp size={18} />} label="Total Budget" value={fmt(totalBudget)} />
      </div>

      {view === 'analytics' ? <AnalyticsView projects={projects} /> : (
        <>
          {showForm && <NewProjectForm onSave={handleCreate} onCancel={() => setShowForm(false)} />}

          {/* Search + filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by name, client or location..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
              {(['all', 'active', 'paused', 'completed', 'archived'] as const).map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors shrink-0
                    ${filter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {s === 'all' ? 'All' : STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Project grid */}
          {loading ? (
            <div className="text-center py-16 text-sm text-gray-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
              <FolderKanban size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">
                {search || filter !== 'all' ? 'No projects match your filters' : 'No projects yet'}
              </p>
              {!search && filter === 'all' && (
                <button onClick={() => setShowForm(true)} className="mt-3 text-sm text-blue-600 hover:underline">
                  Create first project
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(p => (
                <ProjectCard key={p.id} project={p} onClick={() => handleCardClick(p)} onStatusChange={handleStatusChange} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Loading overlay */}
      {loadingDetail && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-xl p-6 shadow-xl text-sm text-gray-500">Loading project...</div>
        </div>
      )}

      {/* Modals */}
      {editingProject && (
        <EditProjectModal project={editingProject} onClose={() => setEditingProject(null)} onSaved={handleProjectSaved} />
      )}
      {selected && (
        <ProjectDetailModal
          project={selected}
          onClose={() => setSelected(null)}
          onExport={(p, expenses) => exportProjectExcel(p, expenses)}
          onEdit={() => setEditingProject(selected)}
        />
      )}
    </div>
  )
}