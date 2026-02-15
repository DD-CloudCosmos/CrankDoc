import { Card, CardContent } from '@/components/ui/card'
import type { ServiceInterval } from '@/types/database.types'

interface ServiceIntervalTableProps {
  intervals: ServiceInterval[]
}

export function ServiceIntervalTable({ intervals }: ServiceIntervalTableProps) {
  if (intervals.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8 text-center">
        <p className="text-muted-foreground">
          No service intervals available for this model.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop table view */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="pb-2 pr-4 text-left font-medium text-zinc-400">Service</th>
              <th className="pb-2 pr-4 text-right font-medium text-zinc-400">Miles</th>
              <th className="pb-2 pr-4 text-right font-medium text-zinc-400">Km</th>
              <th className="pb-2 text-right font-medium text-zinc-400">Months</th>
            </tr>
          </thead>
          <tbody>
            {intervals.map((interval) => (
              <tr key={interval.id} className="border-b border-zinc-800/50">
                <td className="py-3 pr-4">
                  <p className="font-medium">{interval.service_name}</p>
                  {interval.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{interval.description}</p>
                  )}
                </td>
                <td className="py-3 pr-4 text-right tabular-nums">
                  {interval.interval_miles ? interval.interval_miles.toLocaleString() : '—'}
                </td>
                <td className="py-3 pr-4 text-right tabular-nums">
                  {interval.interval_km ? interval.interval_km.toLocaleString() : '—'}
                </td>
                <td className="py-3 text-right tabular-nums">
                  {interval.interval_months ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="space-y-3 sm:hidden">
        {intervals.map((interval) => (
          <Card key={interval.id}>
            <CardContent className="p-4">
              <p className="font-medium">{interval.service_name}</p>
              {interval.description && (
                <p className="mt-1 text-xs text-muted-foreground">{interval.description}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400">
                {interval.interval_miles && (
                  <span>{interval.interval_miles.toLocaleString()} mi</span>
                )}
                {interval.interval_km && (
                  <span>{interval.interval_km.toLocaleString()} km</span>
                )}
                {interval.interval_months && (
                  <span>{interval.interval_months} months</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
