type Props = {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}

export default function FormField({ label, required, error, children }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}