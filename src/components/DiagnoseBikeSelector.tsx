'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
    <div
      className="bg-card rounded-[24px] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
      style={{ animation: 'riseIn 0.6s ease-out both' }}
    >
      <h2 className="text-xl font-bold">Select Your Motorcycle</h2>
      <p className="text-muted-foreground mb-4">Choose your bike to start</p>

      {/* Category pills - horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? 'pill-active' : 'pill'}
            size="sm"
            className="shrink-0"
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Bike list */}
      <div className="space-y-2">
        {filteredMotorcycles.map((moto, index) => (
          <Link href={`/diagnose?bike=${moto.id}`} key={moto.id}>
            <div
              className="rounded-[16px] border border-border bg-background px-4 py-3 flex items-center justify-between hover:bg-accent transition-colors"
              style={{ animation: 'riseIn 0.6s ease-out both', animationDelay: `${index * 0.05}s` }}
            >
              <div>
                <span className="font-semibold">{moto.make} {moto.model}</span>
                <div className="text-sm text-muted-foreground">
                  {moto.generation || `${moto.year_start}${moto.year_end ? `-${moto.year_end}` : '-present'}`}
                  {moto.category && ` · ${capitalize(moto.category)}`}
                  {moto.displacement_cc && ` · ${moto.displacement_cc}cc`}
                </div>
                {treeCounts[moto.id] && (
                  <span className="text-xs text-muted-foreground">{treeCounts[moto.id]} guides</span>
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
            </div>
          </Link>
        ))}
      </div>

      {/* General guides separator */}
      <div className="mt-6 border-t border-border pt-4">
        <p className="text-sm text-muted-foreground mb-2">Don&apos;t know your model?</p>
        <Link href="/diagnose?bike=general" className="text-sm font-medium hover:underline">
          Browse general guides →
        </Link>
      </div>
    </div>
  )
}
