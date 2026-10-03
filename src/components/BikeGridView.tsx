import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { BikeImage } from '@/components/BikeImage'
import type { MotorcycleWithImage } from '@/app/bikes/page'

interface BikeGridViewProps {
  motorcycles: MotorcycleWithImage[]
}

export function BikeGridView({ motorcycles }: BikeGridViewProps) {
  if (motorcycles.length === 0) {
    return (
      <div className="rounded-[20px] bg-card p-10 text-center shadow-card">
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
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
      {motorcycles.map((moto) => {
        const yearRange = moto.year_end
          ? `${moto.year_start}–${moto.year_end}`
          : `${moto.year_start}–present`
        const displacement = moto.displacement_cc ? `${moto.displacement_cc}cc` : null
        const hp = moto.horsepower ? `${moto.horsepower} hp` : null
        const specs = [displacement, hp].filter(Boolean).join(' · ')

        return (
          <Link
            key={moto.id}
            href={`/bikes/${moto.id}`}
            className="group block rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <BikeImage
              image={moto.primaryImage ?? null}
              make={moto.make}
              model={moto.model}
              className="transition-opacity group-hover:opacity-90"
            />
            <div className="mt-2.5 px-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] text-muted-foreground">{yearRange}</span>
                {moto.category && (
                  <Badge variant="secondary" className="text-[11px] font-medium">
                    {moto.category.charAt(0).toUpperCase() + moto.category.slice(1)}
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 truncate text-[17px] font-semibold tracking-[-0.01em]">
                {moto.make} {moto.model}
              </p>
              {specs && <p className="truncate text-[13px] text-muted-foreground">{specs}</p>}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
