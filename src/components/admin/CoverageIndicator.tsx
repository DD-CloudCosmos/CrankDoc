import { cn } from '@/lib/utils'
import type { CoverageStatus } from '@/lib/manuals'

interface CoverageIndicatorProps {
  status: CoverageStatus
  className?: string
}

const statusConfig = {
  ingested: {
    label: 'Ingested',
    dotClass: 'bg-green-500',
    textClass: 'text-green-700 dark:text-green-400',
  },
  local_only: {
    label: 'Local Only',
    dotClass: 'bg-amber-500',
    textClass: 'text-amber-700 dark:text-amber-400',
  },
  missing: {
    label: 'Missing',
    dotClass: 'bg-gray-300 dark:bg-gray-600',
    textClass: 'text-muted-foreground',
  },
} as const

export function CoverageIndicator({ status, className }: CoverageIndicatorProps) {
  const config = statusConfig[status]

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs', className)}>
      <span
        className={cn('h-2 w-2 shrink-0 rounded-full', config.dotClass)}
        aria-hidden="true"
      />
      <span className={config.textClass}>{config.label}</span>
    </span>
  )
}
