import * as XLSX from 'xlsx'
import { APP_CONFIG } from '../config'

// --- TIPOS ---
type Payment = {
  id: string
  concept: string
  amount: string | number
  date: string
  method: string
  notes?: string
  receiptUrl?: string | null
}

type Contract = {
  id: string
  startDate: string
  endDate: string
  paymentType: string
  value: string | number
  project: { name: string; location?: string | null }
  payments: Payment[]
}

type WorkerDetail = {
  name: string
  ssn: string
  role: string
  type: string
  state?: string | null
  workAuthorization: string
  contracts: Contract[]
}

export type DateRange = {
  from: Date
  to: Date
  label: string
}

// ─── Tipos para Projects ─────────────────────────────────────────────────────
type ProjectPayment = {
  id: string
  date: string
  amount: number
  concept: string
  method: string
  notes?: string | null
  receiptUrl?: string | null
}

type ProjectTeamMember = {
  id: string
  name: string
  role: string
  position?: string
}

type ProjectContractedCompany = {
  id: string
  contractId: string
  name: string
  ein?: string
  contactPerson?: string | null
  startDate?: string
  endDate?: string
  value?: number
  paymentType?: string
  payments?: ProjectPayment[]
}

type ProjectTeamMemberFull = ProjectTeamMember & {
  value?: number
  paymentType?: string
  payments?: ProjectPayment[]
}

export type ProjectExportData = {
  id: string
  name: string
  location?: string | null
  status: string
  description?: string | null
  clientContact?: string | null
  startDate?: string | null
  endDate?: string | null
  budget?: number | null
  spent?: number
  createdAt: string
  team?: ProjectTeamMemberFull[]
  companies?: ProjectContractedCompany[]
  payments?: ProjectPayment[]
}

// ─── Tipos para Expenses ──────────────────────────────────────────────────────
export type ExpenseExportData = {
  id: string
  description: string
  amount: number
  date: string
  category: string
  paymentMethod?: string
  notes?: string
  receiptUrl?: string
  project?: { name: string } | null
  company?: { name: string } | null
}

// --- UTILIDAD ---
const formatName = (str: string) => {
  if (!str) return ""
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const makeLink = (url?: string | null) => {
  if (!url) return '—'
  return { t: 's', v: 'View Receipt', l: { Target: url } }
}

const fmtMoney = (n?: number | null) =>
  (n != null) ? `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'

const fmtD = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

// --- GENERADORES DE RANGOS ---
export function getDateRanges(year: number): Record<string, DateRange> {
  return {
    'Q1': { label: `Q1 ${year} (Jan–Mar)`, from: new Date(year, 0, 1), to: new Date(year, 2, 31) },
    'Q2': { label: `Q2 ${year} (Apr–Jun)`, from: new Date(year, 3, 1), to: new Date(year, 5, 30) },
    'Q3': { label: `Q3 ${year} (Jul–Sep)`, from: new Date(year, 6, 1), to: new Date(year, 8, 30) },
    'Q4': { label: `Q4 ${year} (Oct–Dec)`, from: new Date(year, 9, 1), to: new Date(year, 11, 31) },
    'H1': { label: `H1 ${year} (Jan–Jun)`, from: new Date(year, 0, 1), to: new Date(year, 5, 30) },
    'H2': { label: `H2 ${year} (Jul–Dec)`, from: new Date(year, 6, 1), to: new Date(year, 11, 31) },
    'Annual': { label: `Annual ${year}`, from: new Date(year, 0, 1), to: new Date(year, 11, 31) },
  }
}

export function getMonthRanges(year: number): Record<string, DateRange> {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  return Object.fromEntries(
    months.map((m, i) => [
      m,
      { label: `${m} ${year}`, from: new Date(year, i, 1), to: new Date(year, i + 1, 0) }
    ])
  )
}

// ─── EXPORTACIÓN HR ──────────────────────────────────────────────────────────
export function exportWorkersExcel(workers: WorkerDetail[], range: DateRange) {
  const wb = XLSX.utils.book_new()

  const rows: any[][] = [
    ['Worker Name', 'Role', 'Project', 'Contract Value', 'Payment Concept', 'Amount', 'Date', 'Method', 'Receipt']
  ]

  const startStr = range.from.toISOString().split('T')[0]
  const endStr = range.to.toISOString().split('T')[0]

  workers.forEach(worker => {
    const prettyName = formatName(worker.name)
    const contracts = worker.contracts || []
    let hasMatchInDateRange = false
    let workerTotal = 0

    const workerRows: any[][] = []

    contracts.forEach(contract => {
      const payments = contract.payments || []
      payments.forEach(p => {
        if (!p.date) return
        const pDateStr = new Date(p.date).toISOString().split('T')[0]
        const isMatch = pDateStr >= startStr && pDateStr <= endStr
        if (isMatch) {
          hasMatchInDateRange = true
          const amount = Number(p.amount) || 0
          workerTotal += amount
          workerRows.push([
            prettyName, worker.role,
            contract.project?.name || 'N/A',
            fmtMoney(Number(contract.value) || 0),
            p.concept, fmtMoney(amount), pDateStr, p.method || 'N/A',
            makeLink(p.receiptUrl)
          ])
        }
      })
    })

    if (!hasMatchInDateRange) {
      const projectName = contracts.length > 0 ? (contracts[0].project?.name || 'Assigned') : 'No Project'
      const contractVal = contracts.length > 0 ? Number(contracts[0].value || 0) : 0
      rows.push([prettyName, worker.role, projectName, fmtMoney(contractVal), '(No payments in this period)', '—', '—', '—', '—'])
    } else {
      rows.push(...workerRows)
      rows.push(['', '', '', '', 'SUBTOTAL', fmtMoney(workerTotal), '', '', ''])
      rows.push([])
    }
  })

  // Grand total
  const grandTotal = workers.reduce((s, w) => {
    const startStr2 = range.from.toISOString().split('T')[0]
    const endStr2 = range.to.toISOString().split('T')[0]
    return s + w.contracts.reduce((cs, c) =>
      cs + c.payments.filter(p => {
        const d = new Date(p.date).toISOString().split('T')[0]
        return d >= startStr2 && d <= endStr2
      }).reduce((ps, p) => ps + Number(p.amount), 0), 0)
  }, 0)
  rows.push(['', '', '', '', 'GRAND TOTAL', fmtMoney(grandTotal), '', '', ''])

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [
    { wch: 28 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 35 }, { wch: 14 }, { wch: 15 }, { wch: 15 }, { wch: 16 }
  ]
  XLSX.utils.book_append_sheet(wb, ws, 'Payroll Detail')

  let fileNamePrefix = "General_HR_Report"
  if (workers.length === 1) {
    fileNamePrefix = formatName(workers[0].name).trim().replace(/\s+/g, '_')
  }
  const cleanDateLabel = range.label.replace(/[^a-zA-Z0-9]/g, '_')
  XLSX.writeFile(wb, `${fileNamePrefix}_${cleanDateLabel}.xlsx`)
}

// ─── EXPORTACIÓN DE PROYECTO ─────────────────────────────────────────────────
export function exportProjectExcel(project: ProjectExportData, expenses: ExpenseExportData[] = []) {
  const wb = XLSX.utils.book_new()

  const companies = project.companies ?? []
  const team = project.team ?? []

  const totalCompanyPaid = companies.reduce((s, c) =>
    s + (c.payments ?? []).reduce((ps, p) => ps + p.amount, 0), 0)
  const totalWorkerPaid = team.reduce((s, m) =>
    s + (m.payments ?? []).reduce((ps, p) => ps + p.amount, 0), 0)
  const totalPaid = totalCompanyPaid + totalWorkerPaid
  const remaining = project.budget != null ? project.budget - totalPaid : null

  const summaryRows: any[][] = [
    ['PROJECT SUMMARY', '', ''],
    [],
    ['Project', project.name, ''],
    ['Status', project.status.charAt(0).toUpperCase() + project.status.slice(1), ''],
    ['Location', project.location ?? '—', ''],
    ['Client Contact', project.clientContact ?? '—', ''],
    ['Description', project.description ?? '—', ''],
    [],
    ['DATES', '', ''],
    ['Start Date', fmtD(project.startDate), ''],
    ['End Date', fmtD(project.endDate), ''],
    [],
    ['FINANCIALS', '', ''],
    ['Total Budget', fmtMoney(project.budget), ''],
    ['Paid to Companies', fmtMoney(totalCompanyPaid), `${companies.length} subcontractor(s)`],
    ['Paid to Workers', fmtMoney(totalWorkerPaid), `${team.length} worker(s)`],
    ['Total Spent', fmtMoney(totalPaid), ''],
    ['Remaining', fmtMoney(remaining), ''],
  ]

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
  wsSummary['!cols'] = [{ wch: 22 }, { wch: 35 }, { wch: 25 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  // Subcontractors
  const companyRows: any[][] = [
    ['Company', 'EIN', 'Contact', 'Contract Value', 'Payment Type', 'Start', 'End', 'Concept', 'Amount', 'Date', 'Method', 'Receipt']
  ]

  if (companies.length === 0) {
    companyRows.push(['No subcontractors assigned', '', '', '', '', '', '', '', '', '', '', ''])
  } else {
    companies.forEach(c => {
      const companyPayments = c.payments ?? []
      const companyTotal = companyPayments.reduce((s, p) => s + p.amount, 0)
      if (companyPayments.length === 0) {
        companyRows.push([
          formatName(c.name), c.ein ?? '—', c.contactPerson ?? '—',
          fmtMoney(c.value ?? 0), c.paymentType ?? '—',
          fmtD(c.startDate), fmtD(c.endDate),
          '(No payments yet)', '—', '—', '—', '—'
        ])
      } else {
        companyPayments.forEach((p, i) => {
          companyRows.push([
            i === 0 ? formatName(c.name) : '',
            i === 0 ? (c.ein ?? '—') : '',
            i === 0 ? (c.contactPerson ?? '—') : '',
            i === 0 ? fmtMoney(c.value ?? 0) : '',
            i === 0 ? (c.paymentType ?? '—') : '',
            i === 0 ? fmtD(c.startDate) : '',
            i === 0 ? fmtD(c.endDate) : '',
            p.concept, fmtMoney(p.amount), fmtD(p.date), p.method,
            makeLink(p.receiptUrl)
          ])
        })
        companyRows.push(['', '', '', '', '', '', '', 'SUBTOTAL', fmtMoney(Number(companyTotal)), '', '', ''])
        companyRows.push([])
      }
    })
    companyRows.push(['', '', '', '', '', '', '', 'GRAND TOTAL', fmtMoney(totalCompanyPaid), '', '', ''])
  }

  const wsCompanies = XLSX.utils.aoa_to_sheet(companyRows)
  wsCompanies['!cols'] = [
    { wch: 25 }, { wch: 14 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 13 }, { wch: 13 }, { wch: 30 }, { wch: 14 }, { wch: 13 }, { wch: 12 }, { wch: 16 }
  ]
  XLSX.utils.book_append_sheet(wb, wsCompanies, 'Subcontractors')

  // Workers
  const workerRows: any[][] = [
    ['Worker', 'Role', 'Type', 'Contract Value', 'Payment Type', 'Start', 'End', 'Concept', 'Amount', 'Date', 'Method', 'Receipt']
  ]

  if (team.length === 0) {
    workerRows.push(['No individual workers assigned', '', '', '', '', '', '', '', '', '', '', ''])
  } else {
    team.forEach(m => {
      const workerPayments = m.payments ?? []
      const workerTotal = workerPayments.reduce((s, p) => s + p.amount, 0)
      if (workerPayments.length === 0) {
        workerRows.push([
          formatName(m.name), m.role, m.position ?? '—',
          fmtMoney(m.value ?? 0), m.paymentType ?? '—',
          '—', '—', '(No payments yet)', '—', '—', '—', '—'
        ])
      } else {
        workerPayments.forEach((p, i) => {
          workerRows.push([
            i === 0 ? formatName(m.name) : '',
            i === 0 ? m.role : '',
            i === 0 ? (m.position ?? '—') : '',
            i === 0 ? fmtMoney(m.value ?? 0) : '',
            i === 0 ? (m.paymentType ?? '—') : '',
            i === 0 ? fmtD((m as any).startDate) : '',
            i === 0 ? fmtD((m as any).endDate) : '',
            p.concept, fmtMoney(p.amount), fmtD(p.date), p.method,
            makeLink(p.receiptUrl)
          ])
        })
        workerRows.push(['', '', '', '', '', '', '', 'SUBTOTAL', fmtMoney(Number(workerTotal)), '', '', ''])
        workerRows.push([])
      }
    })
    workerRows.push(['', '', '', '', '', '', '', 'GRAND TOTAL', fmtMoney(totalWorkerPaid), '', '', ''])
  }

  const wsWorkers = XLSX.utils.aoa_to_sheet(workerRows)
  wsWorkers['!cols'] = [
    { wch: 25 }, { wch: 15 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 13 }, { wch: 13 }, { wch: 30 }, { wch: 14 }, { wch: 13 }, { wch: 12 }, { wch: 16 }
  ]
  XLSX.utils.book_append_sheet(wb, wsWorkers, 'Workers')

  const safeName = project.name.trim().replace(/[^a-zA-Z0-9]/g, '_')
  const today = new Date().toISOString().split('T')[0]


  // ── Hoja 4: Silver Expenses ───────────────────────────────────────────────


  const expenseRows: any[][] = [
    ['Date', 'Description', 'Category', 'Amount', 'Payment Method', 'Contractor', 'Notes', 'Receipt']
  ]

  if (expenses.length === 0) {
    expenseRows.push(['No expenses associated with this project', '', '', '', '', '', '', ''])
  } else {
    expenses.forEach(e => {
      expenseRows.push([
        fmtD(e.date),
        e.description,
        e.category,
        fmtMoney(e.amount),
        e.paymentMethod ?? '—',
        e.company?.name ?? '—',
        e.notes ?? '—',
        makeLink(e.receiptUrl)
      ])
    })
    const expTotal = expenses.reduce((s, e) => s + Number(e.amount), 0)
    expenseRows.push([])
    expenseRows.push(['', '', 'TOTAL', fmtMoney(expTotal), '', '', '', ''])
  }

  const wsExpenses = XLSX.utils.aoa_to_sheet(expenseRows)
  wsExpenses['!cols'] = [
    { wch: 13 }, { wch: 35 }, { wch: 18 }, { wch: 14 },
    { wch: 16 }, { wch: 22 }, { wch: 25 }, { wch: 16 }
  ]
  XLSX.utils.book_append_sheet(wb, wsExpenses, `${APP_CONFIG.name} Expenses`)
  XLSX.writeFile(wb, `Project_${safeName}_${today}.xlsx`)
}

// ─── EXPORTACIÓN COMPANIES ───────────────────────────────────────────────────
type CompanyContract = {
  id: string
  startDate: string
  endDate: string
  paymentType: string
  value: string | number
  project: { name: string; location?: string | null }
  payments: Payment[]
}

type CompanyDetail = {
  id: string
  name: string
  ein: string
  contactPerson?: string | null
  phone?: string | null
  email?: string | null
  state?: string | null
  contracts: CompanyContract[]
}

export function exportCompaniesExcel(companies: CompanyDetail[], range: DateRange) {
  const wb = XLSX.utils.book_new()

  const rows: any[][] = [
    ['Company Name', 'EIN', 'Contact', 'Project', 'Contract Value', 'Payment Concept', 'Amount', 'Date', 'Method', 'Receipt']
  ]

  const startStr = range.from.toISOString().split('T')[0]
  const endStr = range.to.toISOString().split('T')[0]
  let grandTotal = 0

  companies.forEach(company => {
    const prettyName = formatName(company.name)
    const contracts = company.contracts || []
    let hasMatch = false
    let companyTotal = 0
    const companyRows: any[][] = []

    contracts.forEach(contract => {
      const payments = contract.payments || []
      payments.forEach(p => {
        if (!p.date) return
        const pDateStr = new Date(p.date).toISOString().split('T')[0]
        if (pDateStr >= startStr && pDateStr <= endStr) {
          hasMatch = true
          const amount = Number(p.amount) || 0
          companyTotal += amount
          grandTotal += amount
          companyRows.push([
            prettyName, company.ein, company.contactPerson ?? '—',
            contract.project?.name || 'N/A',
            fmtMoney(Number(contract.value) || 0),
            p.concept, fmtMoney(amount), pDateStr,
            p.method || 'N/A', makeLink(p.receiptUrl)
          ])
        }
      })
    })

    if (!hasMatch) {
      const projectName = contracts.length > 0 ? (contracts[0].project?.name || 'Assigned') : 'No Project'
      const contractVal = contracts.length > 0 ? Number(contracts[0].value || 0) : 0
      rows.push([
        prettyName, company.ein, company.contactPerson ?? '—',
        projectName, fmtMoney(contractVal),
        '(No payments in this period)', '—', '—', '—', '—'
      ])
    } else {
      rows.push(...companyRows)
      rows.push(['', '', '', '', '', 'SUBTOTAL', fmtMoney(companyTotal), '', '', ''])
      rows.push([])
    }
  })

  rows.push(['', '', '', '', '', 'GRAND TOTAL', fmtMoney(grandTotal), '', '', ''])

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [
    { wch: 28 }, { wch: 14 }, { wch: 18 }, { wch: 20 }, { wch: 15 }, { wch: 35 }, { wch: 14 }, { wch: 15 }, { wch: 15 }, { wch: 16 }
  ]
  XLSX.utils.book_append_sheet(wb, ws, 'Subcontractor Payments')

  let fileNamePrefix = "General_Companies_Report"
  if (companies.length === 1) {
    fileNamePrefix = formatName(companies[0].name).trim().replace(/\s+/g, '_')
  }
  const cleanDateLabel = range.label.replace(/[^a-zA-Z0-9]/g, '_')
  XLSX.writeFile(wb, `${fileNamePrefix}_${cleanDateLabel}.xlsx`)
}

// ─── EXPORTACIÓN EXPENSES ────────────────────────────────────────────────────
export function exportExpensesExcel(expenses: ExpenseExportData[], range: DateRange) {
  const wb = XLSX.utils.book_new()

  const startStr = range.from.toISOString().split('T')[0]
  const endStr = range.to.toISOString().split('T')[0]

  const filtered = expenses.filter(e => {
    const d = new Date(e.date).toISOString().split('T')[0]
    return d >= startStr && d <= endStr
  })

  // ── Hoja 1: Detail ────────────────────────────────────────────────────────
  const rows: any[][] = [
    ['Date', 'Description', 'Category', 'Amount', 'Payment Method', 'Project', 'Contractor', 'Notes', 'Receipt']
  ]

  // Agrupar por categoría para subtotales
  const byCategory: Record<string, ExpenseExportData[]> = {}
  filtered.forEach(e => {
    const cat = e.category || 'General'
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(e)
  })

  let grandTotal = 0

  Object.entries(byCategory).forEach(([category, items]) => {
    let categoryTotal = 0
    items.forEach(e => {
      const amount = Number(e.amount)
      categoryTotal += amount
      grandTotal += amount
      rows.push([
        fmtD(e.date),
        e.description,
        e.category,
        fmtMoney(amount),
        e.paymentMethod ?? '—',
        e.project?.name ?? '—',
        e.company?.name ?? '—',
        e.notes ?? '—',
        makeLink(e.receiptUrl)
      ])
    })
    rows.push(['', '', `SUBTOTAL ${category.toUpperCase()}`, fmtMoney(categoryTotal), '', '', '', '', ''])
    rows.push([])
  })

  rows.push(['', '', 'GRAND TOTAL', fmtMoney(grandTotal), '', '', '', '', ''])

  const wsDetail = XLSX.utils.aoa_to_sheet(rows)
  wsDetail['!cols'] = [
    { wch: 14 }, { wch: 35 }, { wch: 20 }, { wch: 14 }, { wch: 16 }, { wch: 22 }, { wch: 22 }, { wch: 25 }, { wch: 16 }
  ]
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Expenses Detail')

  // ── Hoja 2: Summary ───────────────────────────────────────────────────────
  const summaryRows: any[][] = [
    ['EXPENSES SUMMARY', ''],
    [],
    ['Period', range.label],
    ['Total Expenses', fmtMoney(grandTotal)],
    ['# of Expenses', filtered.length],
    [],
    ['BY CATEGORY', ''],
  ]

  Object.entries(byCategory).forEach(([cat, items]) => {
    const total = items.reduce((s, e) => s + Number(e.amount), 0)
    summaryRows.push([cat, fmtMoney(total)])
  })

  summaryRows.push([])
  summaryRows.push(['BY PROJECT', ''])
  const byProject: Record<string, number> = {}
  filtered.forEach(e => {
    const key = e.project?.name ?? 'No Project'
    byProject[key] = (byProject[key] ?? 0) + Number(e.amount)
  })
  Object.entries(byProject).forEach(([proj, total]) => {
    summaryRows.push([proj, fmtMoney(total)])
  })

  summaryRows.push([])
  summaryRows.push(['BY CONTRACTOR', ''])
  const byCompany: Record<string, number> = {}
  filtered.forEach(e => {
    const key = e.company?.name ?? 'No Contractor'
    byCompany[key] = (byCompany[key] ?? 0) + Number(e.amount)
  })
  Object.entries(byCompany).forEach(([comp, total]) => {
    summaryRows.push([comp, fmtMoney(total)])
  })

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
  wsSummary['!cols'] = [{ wch: 28 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  const cleanDateLabel = range.label.replace(/[^a-zA-Z0-9]/g, '_')
    
  XLSX.writeFile(wb, `${APP_CONFIG.name}_Expenses_${cleanDateLabel}.xlsx`)
}