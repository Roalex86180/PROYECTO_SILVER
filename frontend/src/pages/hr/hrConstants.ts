export const US_STATES = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
    'Wisconsin', 'Wyoming',
].map(s => ({ value: s, label: s }))

export const ROLES = [
    'Electrician', 'Plumber', 'Carpenter', 'Painter', 'Installer',
    'Supervisor', 'General Helper', 'Mason', 'Other',
].map(r => ({ value: r, label: r }))

export const WORKER_TYPES = [
    { value: 'W-2 Employee', label: 'W-2 Employee' },
    { value: '1099 Contractor', label: '1099 Contractor' },
    { value: 'Subcontractor', label: 'Subcontractor' },
]

export const WORK_AUTH = [
    { value: 'US Citizen', label: 'US Citizen' },
    { value: 'Permanent Resident', label: 'Permanent Resident (Green Card)' },
    { value: 'Work Visa', label: 'Work Visa (H-2B / H-1B)' },
    { value: 'EAD', label: 'Employment Authorization (EAD)' },
    { value: 'TN Visa', label: 'TN Visa (Canada/Mexico)' },
]

export const PAYMENT_TYPES = [
    { value: 'Fixed', label: 'Fixed' },
    { value: 'Hourly', label: 'Hourly' },
    { value: 'Weekly', label: 'Weekly' },
    { value: 'Biweekly', label: 'Biweekly' },
    { value: 'Monthly', label: 'Monthly' },
]