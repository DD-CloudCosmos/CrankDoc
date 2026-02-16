import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { BikeImage } from '@/components/BikeImage'
import type { MotorcycleWithImage } from '@/app/bikes/page'

interface BikeGridViewProps {
  motorcycles: MotorcycleWithImage[]
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

export function BikeGridView({ motorcycles }: BikeGridViewProps) {
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
            className="group overflow-hidden rounded-[16px] border border-border bg-card transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
          >
            {/* Image with gradient overlay for make/model */}
            <div className="relative">
              <BikeImage
                image={moto.primaryImage ?? null}
                make={moto.make}
                model={moto.model}
                className="rounded-none"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8">
                <p className="truncate text-sm font-semibold text-white">
                  {moto.make} {moto.model}
                </p>
              </div>
            </div>

            {/* Specs below image */}
            <div className="space-y-1.5 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">{yearRange}</span>
                {moto.category && (
                  <Badge variant={categoryVariant(moto.category)} className="text-[10px]">
                    {moto.category.charAt(0).toUpperCase() + moto.category.slice(1)}
                  </Badge>
                )}
              </div>
              {specs && (
                <p className="truncate text-xs text-muted-foreground">{specs}</p>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
