'use client'

import { useRef, useEffect } from 'react'
import { SearchInput } from './SearchInput'
import { SearchResults } from './SearchResults'
import { useSearch } from '@/hooks/useSearch'

/**
 * Desktop inline search: input in the nav bar with a dropdown results panel.
 * Closes when a result is clicked or the user clicks outside.
 */
export function DesktopSearch() {
  const { query, setQuery, results, isLoading, clear } = useSearch()
  const containerRef = useRef<HTMLDivElement>(null)

  const hasResults = !!results || isLoading
  const isOpen = query.length >= 2 && hasResults

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        clear()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, clear])

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        clear()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, clear])

  return (
    <div ref={containerRef} className="relative w-64 lg:w-80">
      <SearchInput
        value={query}
        onChange={setQuery}
        onClear={clear}
        isOpen={isOpen}
        resultsId="desktop-search-results"
      />
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[60vh] overflow-y-auto rounded-[12px] border border-border bg-background shadow-lg">
          <SearchResults
            results={results}
            isLoading={isLoading}
            hasQuery={query.length >= 2}
            onResultClick={clear}
            id="desktop-search-results"
          />
        </div>
      )}
    </div>
  )
}
