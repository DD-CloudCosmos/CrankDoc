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
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => (
        <Button
          key={cat.value}
          variant={activeCategory === cat.value ? 'default' : 'outline'}
          size="sm"
          className={activeCategory === cat.value ? 'rounded-[999px] bg-[#1F1F1F] text-white' : 'rounded-[999px] bg-background text-foreground'}
          onClick={() => onChange(cat.value)}
        >
          {cat.label}
        </Button>
      ))}
    </div>
  )
}
