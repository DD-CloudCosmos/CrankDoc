'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { List, LayoutGrid, Search } from 'lucide-react'

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
    <div className="mb-6 space-y-4">
      {/* Search + view switch */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by make or model..."
            value={currentSearch}
            onChange={(e) => updateFilter('search', e.target.value || null)}
            className="rounded-[10px] pl-9"
            aria-label="Search motorcycles"
          />
        </div>
        <SegmentedControl
          aria-label="View"
          value={currentView === 'grid' ? 'grid' : 'table'}
          onChange={(value) => updateFilter('view', value)}
          options={[
            { value: 'table', label: <><List aria-hidden="true" /><span>Table</span></> },
            { value: 'grid', label: <><LayoutGrid aria-hidden="true" /><span>Grid</span></> },
          ]}
        />
      </div>

      <FilterRow label="Category">
        {CATEGORIES.map((category) => (
          <Button
            key={category}
            variant={currentCategory === category ? 'pill-active' : 'pill'}
            size="sm"
            className="shrink-0"
            aria-pressed={currentCategory === category}
            onClick={() => updateFilter('category', currentCategory === category ? null : category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Button>
        ))}
      </FilterRow>

      <FilterRow label="Make">
        {availableMakes.map((make) => (
          <Button
            key={make}
            variant={currentMake === make ? 'pill-active' : 'pill'}
            size="sm"
            className="shrink-0"
            aria-pressed={currentMake === make}
            onClick={() => updateFilter('make', currentMake === make ? null : make)}
          >
            {make}
          </Button>
        ))}
      </FilterRow>

      {(totalCount !== undefined || hasActiveFilters) && (
        <div className="flex min-h-[44px] items-center justify-between gap-4">
          {totalCount !== undefined ? (
            <p className="text-[15px] text-muted-foreground" data-testid="result-count" aria-live="polite">
              Showing {totalCount} {totalCount === 1 ? 'motorcycle' : 'motorcycles'}
            </p>
          ) : (
            <span />
          )}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

/** A labelled, horizontally scrolling row of filter pills. */
function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label}>
      <div className="mb-1.5 text-[13px] uppercase text-muted-foreground">{label}</div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">{children}</div>
    </div>
  )
}
