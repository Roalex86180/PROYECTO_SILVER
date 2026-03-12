import { useState } from 'react'
import { Download, X } from 'lucide-react'
import { getDateRanges, getMonthRanges, exportWorkersExcel, type DateRange } from '../../utils/exportExcel'

type Props = {
  onClose: () => void
  workers: any[]
}

export default function ExportModal({ onClose, workers }: Props) {
  const currentYear = new Date().getFullYear()
  const [year,       setYear]       = useState(currentYear)
  const [mode,       setMode]       = useState<'period' | 'month' | 'custom'>('period')
  const [selected,   setSelected]   = useState<string>('Q1')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo,   setCustomTo]   = useState('')

  const periodRanges = getDateRanges(year)
  const monthRanges  = getMonthRanges(year)

  const handleExport = () => {
    let range: DateRange

    if (mode === 'custom') {
      if (!customFrom || !customTo) return
      range = {
        label: `${customFrom}_to_${customTo}`,
        from:  new Date(customFrom),
        to:    new Date(customTo)
      }
    } else if (mode === 'month') {
      range = monthRanges[selected]
    } else {
      range = periodRanges[selected]
    }

    exportWorkersExcel(workers, range)
    onClose()
  }

  const options = mode === 'month'
    ? Object.entries(monthRanges)
    : Object.entries(periodRanges)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-gray-900">Export to Excel</h2>
            <p className="text-xs text-gray-400 mt-0.5">HR Payments & Contracts Report</p>
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
            value={year}
            onChange={e => setYear(Number(e.target.value))}
          >
            {[currentYear - 1, currentYear, currentYear + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-4">
          {(['period', 'month', 'custom'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setSelected(m === 'month' ? 'January' : 'Q1') }}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium capitalize transition-colors
                ${mode === m ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {m === 'period' ? 'Quarter/Semi/Annual' : m === 'month' ? 'Monthly' : 'Custom Range'}
            </button>
          ))}
        </div>

        {/* Options */}
        {mode !== 'custom' ? (
          <div className="grid grid-cols-2 gap-2 mb-5">
            {options.map(([key, range]) => (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={`px-3 py-2.5 rounded-lg text-sm border text-left transition-colors
                  ${selected === key
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}
              >
                {range.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">From</label>
              <input
                type="date"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">To</label>
              <input
                type="date"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Download size={14} /> Download Excel
          </button>
        </div>
      </div>
    </div>
  )
}