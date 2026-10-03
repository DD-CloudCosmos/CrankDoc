import { cn } from '@/lib/utils'

interface SafetyBadgeProps {
  level: 'green' | 'yellow' | 'red'
  className?: string
}

// Each safety level gets a coloured dot plus a text label, so the rating
// never relies on colour alone.
const safetyConfig = {
  green: {
    label: 'Beginner-safe',
    className: 'bg-safe-background text-safe-foreground',
    dotClassName: 'bg-safe',
  },
  yellow: {
    label: 'Care required',
    className: 'bg-caution-background text-caution-foreground',
    dotClassName: 'bg-caution',
  },
  red: {
    label: 'Pro recommended',
    className: 'bg-danger-background text-danger-foreground',
    dotClassName: 'bg-danger',
  },
} as const

export function SafetyBadge({ level, className }: SafetyBadgeProps) {
  const config = safetyConfig[level]

  return (
    <span
      data-level={level}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-semibold',
        config.className,
        className
      )}
    >
      <span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', config.dotClassName)} />
      {config.label}
    </span>
  )
}
