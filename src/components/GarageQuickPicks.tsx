'use client'

import { GroupedList, ListRow } from '@/components/ui/grouped-list'
import { useGarage } from '@/hooks/useGarage'

interface QuickPickBike {
  id: string
  make: string
  model: string
}

interface GarageQuickPicksProps {
  motorcycles: QuickPickBike[]
  treeCounts: Record<string, number>
}

/** "Your Garage" shortcuts at the top of the Diagnose bike picker. */
export function GarageQuickPicks({ motorcycles, treeCounts }: GarageQuickPicksProps) {
  const { garage } = useGarage()
  if (!garage) return null

  const myBikes = motorcycles.filter((moto) => garage.bikeIds.includes(moto.id))
  if (myBikes.length === 0) return null

  return (
    <GroupedList header="Your Garage" className="mb-6">
      {myBikes.map((moto) => (
        <ListRow
          key={moto.id}
          href={`/diagnose?bike=${moto.id}`}
          label={`${moto.make} ${moto.model}`}
          subtitle={treeCounts[moto.id] ? `${treeCounts[moto.id]} guides` : 'No guides yet'}
        />
      ))}
    </GroupedList>
  )
}
