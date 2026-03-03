'use client'

import { Button } from '@/components/ui/button'

interface GlossaryCategoryFilterProps {
  activeCategory: string
  onChange: (category: string) => void
}

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Engine', value: 'engine' },
  { label: 'Electrical', value: 'electrical' },
  { label: 'Fuel', value: 'fuel' },
  { label: 'Transmission', value: 'transmission' },
  { label: 'Brakes', value: 'brakes' },
  { label: 'Chassis', value: 'chassis' },
  { label: 'Suspension', value: 'suspension' },
  { label: 'Exhaust', value: 'exhaust' },
  { label: 'Cooling', value: 'cooling' },
  { label: 'Tools', value: 'tools' },
  { label: 'General', value: 'general' },
]

export function GlossaryCategoryFilter({ activeCategory, onChange }: GlossaryCategoryFilterProps) {
  return (
    <div className="flex flex-nowrap gap-2 overflow-x-auto">
      {CATEGORIES.map((cat) => (
        <Button
          key={cat.value}
          variant={activeCategory === cat.value ? 'pill-active' : 'pill'}
          size="sm"
          onClick={() => onChange(cat.value)}
        >
          {cat.label}
        </Button>
      ))}
    </div>
  )
}
