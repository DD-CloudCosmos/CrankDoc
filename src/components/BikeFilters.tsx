'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

const CATEGORIES = ['sport', 'naked', 'cruiser', 'adventure', 'scooter'] as const

interface BikeFiltersProps {
  availableMakes: string[]
}

export function BikeFilters({ availableMakes }: BikeFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentCategory = searchParams.get('category')
  const currentMake = searchParams.get('make')

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    router.push(`/bikes?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push('/bikes')
  }

  const hasActiveFilters = currentCategory || currentMake

  return (
    <div className="mb-6 space-y-4 rounded-[24px] bg-[#EADFCB] p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filters</h2>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Category filter */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">Category</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <Button
              key={category}
              variant={currentCategory === category ? 'default' : 'outline'}
              size="sm"
              className={currentCategory === category ? 'rounded-[999px] bg-[#1F1F1F] text-white' : 'rounded-[999px] bg-background text-foreground border-border'}
              onClick={() => updateFilter('category', currentCategory === category ? null : category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Make filter */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">Make</label>
        <div className="flex flex-wrap gap-2">
          {availableMakes.map((make) => (
            <Button
              key={make}
              variant={currentMake === make ? 'default' : 'outline'}
              size="sm"
              className={currentMake === make ? 'rounded-[999px] bg-[#1F1F1F] text-white' : 'rounded-[999px] bg-background text-foreground border-border'}
              onClick={() => updateFilter('make', currentMake === make ? null : make)}
            >
              {make}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
