export default function StatCard({ icon, label, value, sub }: {
    icon: React.ReactNode
    label: string
    value: string
    sub?: string
}) {
    return (
        <div
            className="rounded-xl border border-slate-700/50 px-4 py-3 md:px-5 md:py-4 flex items-center gap-3 md:gap-4"
            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #1e3a5f 100%)' }}
        >
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-blue-300 shrink-0">
                {icon}
            </div>
            <div>
                <p className="text-xs text-blue-300/80 font-medium">{label}</p>
                <p className="text-base md:text-lg font-bold text-white leading-tight">{value}</p>
                {sub && <p className="text-xs text-blue-400/70">{sub}</p>}
            </div>
        </div>
    )
}