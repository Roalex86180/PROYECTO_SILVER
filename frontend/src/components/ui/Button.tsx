type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger'
  loading?: boolean
}

export default function Button({ variant = 'primary', loading, children, className = '', ...props }: Props) {
  const variants = {
    primary:   'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200',
    danger:    'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
  }

  return (
    <button
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg
        text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      )}
      {children}
    </button>
  )
}