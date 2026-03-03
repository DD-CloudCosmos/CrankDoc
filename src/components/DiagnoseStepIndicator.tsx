import Link from 'next/link'
import { Check } from 'lucide-react'

interface DiagnoseStepIndicatorProps {
  currentStep: 1 | 2 | 3
  bikeId?: string
}

const STEPS = [
  { number: 1, label: 'Select' },
  { number: 2, label: 'Symptom' },
  { number: 3, label: 'Fix' },
] as const

function getStepHref(stepNumber: number, bikeId?: string): string | null {
  if (stepNumber === 1) return '/diagnose'
  if (stepNumber === 2 && bikeId) return `/diagnose?bike=${bikeId}`
  return null
}

export function DiagnoseStepIndicator({ currentStep, bikeId }: DiagnoseStepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8 max-w-xs mx-auto">
      {STEPS.map((step, index) => {
        const isActive = step.number === currentStep
        const isCompleted = step.number < currentStep
        const isFuture = step.number > currentStep
        const href = isCompleted ? getStepHref(step.number, bikeId) : null

        return (
          <div key={step.number} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center">
              {/* Step circle */}
              {isCompleted && href ? (
                <Link
                  href={href}
                  className="w-8 h-8 rounded-full bg-[#1F1F1F] text-white flex items-center justify-center"
                  aria-label={`Go back to ${step.label}`}
                >
                  <Check className="w-4 h-4" />
                </Link>
              ) : isCompleted ? (
                <div className="w-8 h-8 rounded-full bg-[#1F1F1F] text-white flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
              ) : isActive ? (
                <div className="w-8 h-8 rounded-full bg-[#1F1F1F] text-white flex items-center justify-center ring-4 ring-[#EADFCB]">
                  {step.number}
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full border-2 border-[#D8CBB4] flex items-center justify-center text-[#D8CBB4]">
                  {step.number}
                </div>
              )}

              {/* Label */}
              <span
                className={`text-xs mt-1 ${
                  isFuture ? 'text-[#D8CBB4]' : 'text-[#1F1F1F]'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connecting line (not after the last step) */}
            {index < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-1 ${
                  step.number < currentStep ? 'bg-[#1F1F1F]' : 'bg-[#D8CBB4]'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
