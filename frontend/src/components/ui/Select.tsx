type Option = { value: string; label: string }

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: Option[]
  placeholder?: string
  error?: boolean
}

export default function Select({ options, placeholder, error, className = '', ...props }: Props) {
  return (
    <select
      className={`w-full px-3 py-2 text-sm border rounded-lg bg-white
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        transition-colors
        ${error ? 'border-red-400' : 'border-gray-200'}
        ${className}`}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}