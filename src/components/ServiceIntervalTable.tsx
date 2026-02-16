import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table'
import type { ServiceInterval } from '@/types/database.types'

interface ServiceIntervalTableProps {
  intervals: ServiceInterval[]
}

export function ServiceIntervalTable({ intervals }: ServiceIntervalTableProps) {
  if (intervals.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          No service intervals available for this model.
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Service</TableHead>
          <TableHead className="text-right">Miles</TableHead>
          <TableHead className="text-right">Km</TableHead>
          <TableHead className="text-right">Months</TableHead>
          <TableHead>Specs</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {intervals.map((interval) => (
          <TableRow key={interval.id}>
            <TableCell>
              <p className="font-medium">{interval.service_name}</p>
              {interval.description && (
                <p className="mt-1 text-xs text-foreground">{interval.description}</p>
              )}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {interval.interval_miles ? interval.interval_miles.toLocaleString() : '—'}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {interval.interval_km ? interval.interval_km.toLocaleString() : '—'}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {interval.interval_months ?? '—'}
            </TableCell>
            <TableCell>
              {interval.torque_spec && (
                <p className="text-xs">
                  <span className="font-medium text-muted-foreground">Torque:</span>{' '}
                  <span className="text-foreground">{interval.torque_spec}</span>
                </p>
              )}
              {interval.fluid_spec && (
                <p className="mt-0.5 text-xs">
                  <span className="font-medium text-muted-foreground">Fluid:</span>{' '}
                  <span className="text-foreground">{interval.fluid_spec}</span>
                </p>
              )}
              {!interval.torque_spec && !interval.fluid_spec && (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
