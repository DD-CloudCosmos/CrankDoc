'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { List, LayoutGrid } from 'lucide-react'

const CATEGORIES = ['sport', 'naked', 'cruiser', 'adventure', 'scooter'] as const

interface BikeFiltersProps {
  availableMakes: string[]
  totalCount?: number
}

export function BikeFilters({ availableMakes, totalCount }: BikeFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentCategory = searchParams.get('category')
  const currentMake = searchParams.get('make')
  const currentSearch = searchParams.get('search') || ''
  const currentView = searchParams.get('view') || 'table'

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
    // Preserve the view param when clearing filters
    const view = searchParams.get('view')
    if (view) {
      router.push(`/bikes?view=${view}`)
    } else {
      router.push('/bikes')
    }
  }

  const hasActiveFilters = currentCategory || currentMake || currentSearch

  return (
    <div className="mb-6 space-y-4 rounded-[24px] bg-[#EADFCB] p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filters</h2>
        <div className="flex items-center gap-2">
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
          {/* View toggle */}
          <div className="flex rounded-[12px] border border-border bg-background p-0.5" role="group" aria-label="View toggle">
            <Button
              variant="ghost"
              size="sm"
              className={currentView === 'table'
                ? 'h-7 w-7 rounded-[8px] bg-[#1F1F1F] p-0 text-white hover:bg-[#1F1F1F] hover:text-white'
                : 'h-7 w-7 rounded-[8px] p-0 text-muted-foreground hover:text-foreground'}
              onClick={() => updateFilter('view', 'table')}
              aria-label="Table view"
              aria-pressed={currentView === 'table'}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={currentView === 'grid'
                ? 'h-7 w-7 rounded-[8px] bg-[#1F1F1F] p-0 text-white hover:bg-[#1F1F1F] hover:text-white'
                : 'h-7 w-7 rounded-[8px] p-0 text-muted-foreground hover:text-foreground'}
              onClick={() => updateFilter('view', 'grid')}
              aria-label="Grid view"
              aria-pressed={currentView === 'grid'}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Search input */}
      <div>
        <Input
          type="search"
          placeholder="Search by make or model..."
          value={currentSearch}
          onChange={(e) => updateFilter('search', e.target.value || null)}
          className="rounded-[999px] border-border bg-background"
          aria-label="Search motorcycles"
        />
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

      {/* Result count */}
      {totalCount !== undefined && (
        <p className="text-sm text-muted-foreground" data-testid="result-count">
          Showing {totalCount} {totalCount === 1 ? 'motorcycle' : 'motorcycles'}
        </p>
      )}
    </div>
  )
}
