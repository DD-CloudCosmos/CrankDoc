'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { GroupedList, ListRow } from '@/components/ui/grouped-list'
import { GarageQuickPicks } from '@/components/GarageQuickPicks'
import type { Motorcycle } from '@/types/database.types'

const CATEGORIES = ['All', 'Sport', 'Naked', 'Cruiser', 'Adventure', 'Scooter'] as const

interface DiagnoseBikeSelectorProps {
  motorcycles: Motorcycle[]
  treeCounts: Record<string, number>
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function DiagnoseBikeSelector({ motorcycles, treeCounts }: DiagnoseBikeSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  const filteredMotorcycles = selectedCategory === 'All'
    ? motorcycles
    : motorcycles.filter((moto) => moto.category === selectedCategory.toLowerCase())

  return (
    <div style={{ animation: 'riseIn 0.4s ease-out both' }}>
      <GarageQuickPicks motorcycles={motorcycles} treeCounts={treeCounts} />

      <h2 className="text-[22px] font-semibold tracking-[-0.02em]">Select Your Motorcycle</h2>
      <p className="mb-4 text-[15px] text-muted-foreground">Choose your bike to start</p>

      {/* Category pills - horizontal scroll */}
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? 'pill-active' : 'pill'}
            size="sm"
            className="shrink-0"
            aria-pressed={selectedCategory === cat}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Bike list */}
      {filteredMotorcycles.length > 0 && (
        <GroupedList>
          {filteredMotorcycles.map((moto) => (
            <ListRow
              key={moto.id}
              href={`/diagnose?bike=${moto.id}`}
              label={<span className="font-medium">{moto.make} {moto.model}</span>}
              subtitle={
                <span>
                  {moto.generation || `${moto.year_start}${moto.year_end ? `-${moto.year_end}` : '-present'}`}
                  {moto.category && ` · ${capitalize(moto.category)}`}
                  {moto.displacement_cc && ` · ${moto.displacement_cc}cc`}
                </span>
              }
              detail={
                <span className="text-[15px]">
                  {treeCounts[moto.id] ? `${treeCounts[moto.id]} guides` : 'No guides yet'}
                </span>
              }
            />
          ))}
        </GroupedList>
      )}

      {/* General guides */}
      <GroupedList header="Don't know your model?" className="mt-8">
        <ListRow href="/diagnose?bike=general" label="Browse general guides" subtitle="Universal troubleshooting for all motorcycles" />
      </GroupedList>
    </div>
  )
}
