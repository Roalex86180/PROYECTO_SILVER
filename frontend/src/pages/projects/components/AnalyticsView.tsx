import { BarChart2 } from 'lucide-react'
import type { Project } from '../../../services/projectService'
import { fmt } from '../projectConstants'

export default function AnalyticsView({ projects }: { projects: Project[] }) {
    const completed = projects.filter(p => p.status === 'completed' && p.budget != null)

    if (completed.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                <BarChart2 size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">No completed projects with budget data yet</p>
                <p className="text-xs text-gray-300 mt-1">Mark projects as Completed to see analytics</p>
            </div>
        )
    }

    const withMetrics = completed.map(p => {
        const budget = p.budget ?? 0
        const spent = p.spent ?? 0
        const profit = budget - spent
        const margin = budget > 0 ? Math.round((profit / budget) * 100) : 0
        return { ...p, budget, spent, profit, margin }
    })

    const byProfit = [...withMetrics].sort((a, b) => b.profit - a.profit)
    const byMargin = [...withMetrics].sort((a, b) => b.margin - a.margin)
    const totalBudget = withMetrics.reduce((s, p) => s + p.budget, 0)
    const totalSpent = withMetrics.reduce((s, p) => s + p.spent, 0)
    const totalProfit = totalBudget - totalSpent
    const avgMargin = withMetrics.length > 0 ? Math.round(withMetrics.reduce((s, p) => s + p.margin, 0) / withMetrics.length) : 0

    const medal = (i: number) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`
    const marginColor = (m: number) => m >= 20 ? 'text-green-600' : m >= 0 ? 'text-yellow-600' : 'text-red-600'
    const marginBg = (m: number) => m >= 20 ? 'bg-green-500' : m >= 0 ? 'bg-yellow-400' : 'bg-red-400'

    return (
        <div className="space-y-5">
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 md:px-5 md:py-4">
                    <p className="text-xs text-gray-400 font-medium">Completed</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{completed.length}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 md:px-5 md:py-4">
                    <p className="text-xs text-gray-400 font-medium">Total Revenue</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{fmt(totalBudget)}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 md:px-5 md:py-4">
                    <p className="text-xs text-gray-400 font-medium">Total Profit</p>
                    <p className={`text-xl md:text-2xl font-bold mt-1 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(totalProfit)}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 md:px-5 md:py-4">
                    <p className="text-xs text-gray-400 font-medium">Avg Margin</p>
                    <p className={`text-xl md:text-2xl font-bold mt-1 ${marginColor(avgMargin)}`}>{avgMargin}%</p>
                </div>
            </div>

            {/* Rankings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">🏆 Ranking por Utilidad</p>
                    <div className="space-y-3">
                        {byProfit.map((p, i) => (
                            <div key={p.id} className={`rounded-lg px-4 py-3 flex items-center justify-between
                ${i === 0 ? 'bg-yellow-50 border border-yellow-100' :
                                    i === 1 ? 'bg-gray-50 border border-gray-100' :
                                        i === 2 ? 'bg-orange-50 border border-orange-100' :
                                            'bg-white border border-gray-100'}`}>
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-lg shrink-0">{medal(i)}</span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                                        <p className={`text-xs font-bold mt-0.5 ${p.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {p.profit >= 0 ? '+' : ''}{fmt(p.profit)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0 ml-3">
                                    <p className="text-xs text-gray-400">Budget</p>
                                    <p className="text-xs font-semibold text-gray-600">{fmt(p.budget)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">🎯 Ranking por Margen %</p>
                    <div className="space-y-4">
                        {byMargin.map((p, i) => (
                            <div key={p.id}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-sm shrink-0">{medal(i)}</span>
                                        <span className="text-sm font-medium text-gray-700 truncate">{p.name}</span>
                                    </div>
                                    <span className={`text-sm font-bold ml-3 shrink-0 ${marginColor(p.margin)}`}>{p.margin}%</span>
                                </div>
                                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-500 ${marginBg(p.margin)}`}
                                        style={{ width: `${Math.max(0, Math.min(100, p.margin))}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Cost breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">💰 Costos por Proyecto</p>
                <div className="space-y-4">
                    {withMetrics.sort((a, b) => b.budget - a.budget).map(p => (
                        <div key={p.id}>
                            <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                                <span className="text-sm font-medium text-gray-700 truncate max-w-[160px] md:max-w-[220px]">{p.name}</span>
                                <div className="flex items-center gap-3 md:gap-5 text-xs shrink-0">
                                    <span className="text-gray-400">Budget <span className="font-semibold text-gray-700">{fmt(p.budget)}</span></span>
                                    <span className="text-gray-400">Spent <span className="font-semibold text-gray-700">{fmt(p.spent)}</span></span>
                                    <span className={`font-bold ${p.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {p.profit >= 0 ? '+' : ''}{fmt(p.profit)}
                                    </span>
                                </div>
                            </div>
                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
                                <div className="h-full bg-blue-400 transition-all duration-500"
                                    style={{ width: `${p.budget > 0 ? Math.min(100, (p.spent / p.budget) * 100) : 0}%` }} />
                                <div className="h-full bg-green-400 transition-all duration-500"
                                    style={{ width: `${p.budget > 0 ? Math.max(0, ((p.budget - p.spent) / p.budget) * 100) : 0}%` }} />
                            </div>
                            <div className="flex gap-4 mt-1">
                                <span className="text-[10px] text-blue-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Spent</span>
                                <span className="text-[10px] text-green-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Remaining</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}