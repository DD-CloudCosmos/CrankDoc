'use client'

import { Loader2 } from 'lucide-react'
import { SearchResultItem } from './SearchResultItem'
import { SEARCH_CATEGORY_LABELS } from '@/types/search.types'
import type { SearchResponse, SearchCategory } from '@/types/search.types'

interface SearchResultsProps {
  results: SearchResponse | null
  isLoading: boolean
  hasQuery: boolean
  onResultClick?: () => void
  id: string
}

const CATEGORY_ORDER: SearchCategory[] = [
  'bikes',
  'diagnosticTrees',
  'dtcCodes',
  'glossaryTerms',
  'recalls',
]

/**
 * Grouped search results panel.
 * Shows results by category, loading skeleton, or empty state.
 */
export function SearchResults({ results, isLoading, hasQuery, onResultClick, id }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div id={id} role="listbox" aria-label="Search results" className="p-4">
        <div className="flex items-center justify-center gap-2 py-4" aria-live="polite">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Searching...</span>
        </div>
      </div>
    )
  }

  if (!results || !hasQuery) {
    return null
  }

  // Count total results across all categories
  const totalResults = CATEGORY_ORDER.reduce(
    (sum, cat) => sum + results[cat].length,
    0
  )

  if (totalResults === 0) {
    return (
      <div id={id} role="listbox" aria-label="Search results" className="p-4">
        <p className="py-4 text-center text-sm text-muted-foreground" aria-live="polite">
          No results found
        </p>
      </div>
    )
  }

  return (
    <div id={id} role="listbox" aria-label="Search results" aria-live="polite">
      {CATEGORY_ORDER.map((category) => {
        const items = results[category]
        if (items.length === 0) return null

        return (
          <div key={category} className="border-b border-border last:border-0">
            <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {SEARCH_CATEGORY_LABELS[category]}
            </p>
            {items.map((item) => (
              <SearchResultItem
                key={item.id}
                result={item}
                onClick={onResultClick}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}
