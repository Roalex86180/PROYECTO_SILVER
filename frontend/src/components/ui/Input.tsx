type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean
}

export default function Input({ error, className = '', ...props }: Props) {
  return (
    <input
      className={`w-full px-3 py-2 text-sm border rounded-lg bg-white
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        placeholder-gray-300 transition-colors
        ${error ? 'border-red-400' : 'border-gray-200'}
        ${className}`}
      {...props}
    />
  )
}