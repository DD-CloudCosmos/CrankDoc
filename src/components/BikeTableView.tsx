import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { BikeImage } from '@/components/BikeImage'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { ChevronUp, ChevronDown } from 'lucide-react'
import type { MotorcycleWithImage } from '@/app/bikes/page'

interface BikeTableViewProps {
  motorcycles: MotorcycleWithImage[]
  sort: string
  sortDir: 'asc' | 'desc'
}

function SortHeader({
  label,
  field,
  currentSort,
  currentDir,
  className,
}: {
  label: string
  field: string
  currentSort: string
  currentDir: 'asc' | 'desc'
  className?: string
}) {
  const isActive = currentSort === field
  const nextDir = isActive && currentDir === 'asc' ? 'desc' : 'asc'

  // Build the URL with the sort params while preserving other params
  const href = `?sort=${field}&sortDir=${nextDir}`

  return (
    <TableHead className={className}>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
        data-testid={`sort-${field}`}
      >
        {label}
        {isActive ? (
          currentDir === 'asc' ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ChevronUp className="h-3.5 w-3.5 opacity-0" />
        )}
      </Link>
    </TableHead>
  )
}

function categoryVariant(cat: string | null) {
  switch (cat) {
    case 'sport':
      return 'default' as const
    case 'naked':
      return 'secondary' as const
    case 'cruiser':
      return 'outline' as const
    case 'adventure':
      return 'secondary' as const
    case 'scooter':
      return 'default' as const
    default:
      return 'default' as const
  }
}

export function BikeTableView({ motorcycles, sort, sortDir }: BikeTableViewProps) {
  if (motorcycles.length === 0) {
    return (
      <div className="rounded-[24px] border border-border bg-card p-8 text-center">
        <p className="text-lg text-muted-foreground">
          No motorcycles found matching your filters.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Try adjusting your filter criteria or clearing all filters.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-[24px] border border-border bg-card sm:block">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
              <SortHeader label="Motorcycle" field="make" currentSort={sort} currentDir={sortDir} />
              <SortHeader label="Years" field="year_start" currentSort={sort} currentDir={sortDir} />
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Category
              </TableHead>
              <SortHeader label="Displacement" field="displacement_cc" currentSort={sort} currentDir={sortDir} className="text-right" />
              <SortHeader label="HP" field="horsepower" currentSort={sort} currentDir={sortDir} className="text-right" />
              <SortHeader label="Weight" field="dry_weight_kg" currentSort={sort} currentDir={sortDir} className="text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {motorcycles.map((moto) => {
              const yearRange = moto.year_end
                ? `${moto.year_start}–${moto.year_end}`
                : `${moto.year_start}–present`

              return (
                <TableRow key={moto.id} className="hover:bg-accent/40">
                  <TableCell>
                    <Link href={`/bikes/${moto.id}`} className="flex items-center gap-3">
                      <BikeImage
                        image={moto.primaryImage ?? null}
                        make={moto.make}
                        model={moto.model}
                        size="thumbnail"
                      />
                      <span className="font-medium">
                        {moto.make} {moto.model}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/bikes/${moto.id}`} className="text-muted-foreground">
                      {yearRange}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/bikes/${moto.id}`}>
                      {moto.category && (
                        <Badge variant={categoryVariant(moto.category)}>
                          {moto.category.charAt(0).toUpperCase() + moto.category.slice(1)}
                        </Badge>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <Link href={`/bikes/${moto.id}`} className="text-muted-foreground">
                      {moto.displacement_cc ? `${moto.displacement_cc}cc` : '—'}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <Link href={`/bikes/${moto.id}`} className="text-muted-foreground">
                      {moto.horsepower ?? '—'}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <Link href={`/bikes/${moto.id}`} className="text-muted-foreground">
                      {moto.dry_weight_kg ? `${moto.dry_weight_kg} kg` : '—'}
                    </Link>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile compact list */}
      <div className="space-y-1 sm:hidden">
        {motorcycles.map((moto) => {
          const displacement = moto.displacement_cc ? `${moto.displacement_cc}cc` : null
          const hp = moto.horsepower ? `${moto.horsepower} hp` : null
          const specs = [displacement, hp].filter(Boolean).join(' · ')

          return (
            <Link
              key={moto.id}
              href={`/bikes/${moto.id}`}
              className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 transition-colors hover:bg-accent/40"
            >
              <BikeImage
                image={moto.primaryImage ?? null}
                make={moto.make}
                model={moto.model}
                size="thumbnail"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {moto.make} {moto.model}
                </p>
                {specs && (
                  <p className="truncate text-xs text-muted-foreground">{specs}</p>
                )}
              </div>
              {moto.category && (
                <Badge variant={categoryVariant(moto.category)} className="shrink-0 text-[10px]">
                  {moto.category.charAt(0).toUpperCase() + moto.category.slice(1)}
                </Badge>
              )}
            </Link>
          )
        })}
      </div>
    </>
  )
}
