'use client'

import { Button } from '@/components/ui/button'

interface DtcCategoryFilterProps {
  activeCategory: string
  onChange: (category: string) => void
}

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Powertrain (P)', value: 'powertrain' },
  { label: 'Chassis (C)', value: 'chassis' },
  { label: 'Body (B)', value: 'body' },
  { label: 'Network (U)', value: 'network' },
]

export function DtcCategoryFilter({ activeCategory, onChange }: DtcCategoryFilterProps) {
  return (
    <div role="group" aria-label="Category">
      <p className="mb-1.5 text-[13px] uppercase text-muted-foreground">Category</p>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
      {CATEGORIES.map((cat) => (
        <Button
          key={cat.value}
          variant={activeCategory === cat.value ? 'pill-active' : 'pill'}
          size="sm"
          className="shrink-0"
          aria-pressed={activeCategory === cat.value}
          onClick={() => onChange(cat.value)}
        >
          {cat.label}
        </Button>
      ))}
      </div>
    </div>
  )
}
