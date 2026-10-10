'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BikeThumb } from '@/components/BikeThumb'
import { useGarage } from '@/hooks/useGarage'
import type { GarageBikeOption } from '@/lib/garage'

interface GarageStripProps {
  bikes: GarageBikeOption[]
}

/**
 * "Your Garage" on the home page: the bikes saved during onboarding, each with
 * a shortcut into Diagnose. Renders nothing until onboarding has run.
 */
export function GarageStrip({ bikes }: GarageStripProps) {
  const { garage, reopenOnboarding } = useGarage()

  if (!garage || !garage.onboarded) return null

  const myBikes = bikes.filter((bike) => garage.bikeIds.includes(bike.id))

  return (
    <section aria-labelledby="garage-title" className="px-[22px] pt-8">
      <div className="mx-auto max-w-[1024px]">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="garage-title" className="text-[22px] font-semibold tracking-[-0.02em]">
            Your Garage
          </h2>
          <button type="button" onClick={reopenOnboarding} className="min-h-[44px] text-[17px] text-link hover:underline">
            Edit
          </button>
        </div>

        {myBikes.length === 0 ? (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4 rounded-[20px] bg-card p-5 shadow-card">
            <p className="text-[15px] text-muted-foreground">Add your bikes to jump straight to their guides.</p>
            <Button variant="secondary" size="sm" onClick={reopenOnboarding}>
              <Plus aria-hidden="true" /> Add a bike
            </Button>
          </div>
        ) : (
          <ul className="-mx-[22px] mt-2 flex snap-x gap-4 overflow-x-auto px-[22px] pb-2">
            {myBikes.map((bike) => (
              <li key={bike.id} className="w-[280px] shrink-0 snap-start overflow-hidden rounded-[20px] bg-card shadow-card">
                <BikeThumb
                  imageUrl={bike.imageUrl}
                  alt={bike.imageAlt ?? `${bike.make} ${bike.model}`}
                  className="h-[150px] w-full rounded-none"
                />
                <div className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] text-muted-foreground">{bike.make}</div>
                    <div className="truncate text-[20px] font-semibold tracking-[-0.02em]">{bike.model}</div>
                    <div className="text-[13px] text-muted-foreground">
                      {bike.treeCount} {bike.treeCount === 1 ? 'guide' : 'guides'}
                    </div>
                  </div>
                  <Button asChild size="sm">
                    <Link href={`/diagnose?bike=${bike.id}`} aria-label={`Diagnose ${bike.make} ${bike.model}`}>
                      Diagnose
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Link href="/garage" prefetch={false} className="mt-3 inline-block min-h-[44px] py-3 text-[17px] text-link hover:underline">Open My Garage</Link>
      </div>
    </section>
  )
}
