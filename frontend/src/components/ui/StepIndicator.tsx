type Step = { number: number; label: string }

type Props = {
  steps: Step[]
  current: number
}

export default function StepIndicator({ steps, current }: Props) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((step, i) => (
        <div key={step.number} className="flex items-center">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
              ${current === step.number ? 'bg-blue-600 text-white' :
                current > step.number  ? 'bg-green-500 text-white' :
                                         'bg-gray-100 text-gray-400'}`}>
              {current > step.number ? '✓' : step.number}
            </div>
            <span className={`text-sm font-medium hidden sm:block
              ${current === step.number ? 'text-blue-600' :
                current > step.number  ? 'text-green-600' : 'text-gray-400'}`}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-12 h-0.5 mx-2 ${current > step.number ? 'bg-green-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}