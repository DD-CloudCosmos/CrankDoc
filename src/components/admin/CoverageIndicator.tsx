import { cn } from '@/lib/utils'
import type { CoverageStatus } from '@/lib/manuals'

interface CoverageIndicatorProps {
  status: CoverageStatus
  className?: string
}

const statusConfig = {
  ingested: {
    label: 'Ingested',
    dotClass: 'bg-safe',
    textClass: 'text-safe-foreground',
  },
  local_only: {
    label: 'Uploaded',
    dotClass: 'bg-caution',
    textClass: 'text-caution-foreground',
  },
  missing: {
    label: 'Missing',
    dotClass: 'bg-border',
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
