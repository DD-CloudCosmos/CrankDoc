import { cn } from '@/lib/utils'

interface SafetyBadgeProps {
  level: 'green' | 'yellow' | 'red'
  className?: string
}

const safetyConfig = {
  green: {
    label: 'Beginner Safe',
    className: 'bg-green-900/50 text-green-400 border-green-800',
  },
  yellow: {
    label: 'Use Caution',
    className: 'bg-yellow-900/50 text-yellow-400 border-yellow-800',
  },
  red: {
    label: 'Professional Recommended',
    className: 'bg-red-900/50 text-red-400 border-red-800',
  },
} as const

export function SafetyBadge({ level, className }: SafetyBadgeProps) {
  const config = safetyConfig[level]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
