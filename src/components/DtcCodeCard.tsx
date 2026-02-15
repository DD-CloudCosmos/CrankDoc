import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { DtcCode } from '@/types/database.types'

interface DtcCodeCardProps {
  dtcCode: DtcCode
}

const SEVERITY_CONFIG: Record<string, { label: string; dotClass: string; badgeClass: string }> = {
  low: {
    label: 'Low',
    dotClass: 'bg-green-500',
    badgeClass: 'border-green-500/30 text-green-400',
  },
  medium: {
    label: 'Medium',
    dotClass: 'bg-amber-500',
    badgeClass: 'border-amber-500/30 text-amber-400',
  },
  high: {
    label: 'High',
    dotClass: 'bg-orange-500',
    badgeClass: 'border-orange-500/30 text-orange-400',
  },
  critical: {
    label: 'Critical',
    dotClass: 'bg-red-500',
    badgeClass: 'border-red-500/30 text-red-400',
  },
}

export function DtcCodeCard({ dtcCode }: DtcCodeCardProps) {
  const severityConfig = dtcCode.severity ? SEVERITY_CONFIG[dtcCode.severity] : null

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="font-mono text-lg">{dtcCode.code}</CardTitle>
            {dtcCode.manufacturer && (
              <Badge variant="secondary" className="text-xs">
                {dtcCode.manufacturer}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {severityConfig && (
              <Badge variant="outline" className={severityConfig.badgeClass}>
                <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${severityConfig.dotClass}`} />
                {severityConfig.label}
              </Badge>
            )}
            {dtcCode.category && (
              <Badge variant="outline">{dtcCode.category}</Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{dtcCode.description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {dtcCode.system && (
          <p className="text-sm text-zinc-300">
            <span className="font-medium text-muted-foreground">System:</span>{' '}
            {dtcCode.system}
          </p>
        )}

        {dtcCode.diagnostic_method && (
          <p className="text-sm text-zinc-300">
            <span className="font-medium text-muted-foreground">Read with:</span>{' '}
            {dtcCode.diagnostic_method}
          </p>
        )}

        {dtcCode.common_causes && dtcCode.common_causes.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
              Common Causes
            </p>
            <ul className="space-y-1">
              {dtcCode.common_causes.map((cause) => (
                <li key={cause} className="text-sm text-zinc-300">
                  {cause}
                </li>
              ))}
            </ul>
          </div>
        )}

        {dtcCode.fix_reference && (
          <div className="border-t border-border pt-3">
            <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
              Fix Reference
            </p>
            <p className="text-sm text-zinc-300">{dtcCode.fix_reference}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
