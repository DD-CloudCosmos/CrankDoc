'use client'

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CoverageIndicator } from './CoverageIndicator'
import { MANUAL_TYPES, MANUAL_TYPE_LABELS } from '@/lib/manuals'
import type { ModelCoverageRow } from '@/lib/manuals'

interface ManualCoverageMatrixProps {
  rows: ModelCoverageRow[]
}

export function ManualCoverageMatrix({ rows }: ManualCoverageMatrixProps) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No motorcycles found in the database.
      </p>
    )
  }

  return (
    <>
      {/* Desktop table — hidden on mobile */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Model</TableHead>
              <TableHead>Years</TableHead>
              <TableHead>Category</TableHead>
              {MANUAL_TYPES.map((type) => (
                <TableHead key={type}>{MANUAL_TYPE_LABELS[type]}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${row.make}-${row.model}`}>
                <TableCell className="font-medium">
                  {row.make} {row.model}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {row.yearRange}
                </TableCell>
                <TableCell>
                  {row.category ? (
                    <Badge variant="outline">{row.category}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                {MANUAL_TYPES.map((type) => (
                  <TableCell key={type}>
                    <CoverageIndicator status={row.coverage[type].status} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card list — hidden on sm+ */}
      <div className="flex flex-col gap-3 sm:hidden">
        {rows.map((row) => (
          <Card key={`${row.make}-${row.model}-mobile`}>
            <CardContent className="p-4">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="font-medium">
                    {row.make} {row.model}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {row.yearRange}
                  </p>
                </div>
                {row.category && (
                  <Badge variant="outline">{row.category}</Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {MANUAL_TYPES.map((type) => (
                  <div key={type} className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">
                      {MANUAL_TYPE_LABELS[type]}:
                    </span>
                    <CoverageIndicator status={row.coverage[type].status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
