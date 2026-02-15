import { cn } from '@/lib/utils'

interface SafetyBadgeProps {
  level: 'green' | 'yellow' | 'red'
  className?: string
}

const safetyConfig = {
  green: {
    label: 'Beginner Safe',
    className: 'bg-green-50 text-green-700 border-green-200',
  },
  yellow: {
    label: 'Use Caution',
    className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  },
  red: {
    label: 'Professional Recommended',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
} as const

export function SafetyBadge({ level, className }: SafetyBadgeProps) {
  const config = safetyConfig[level]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[999px] border px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
