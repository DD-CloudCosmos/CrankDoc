'use client'

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { SearchInput } from './SearchInput'
import { SearchResults } from './SearchResults'
import { useSearch } from '@/hooks/useSearch'

interface SearchOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Full-screen mobile search overlay using Radix Dialog.
 * Contains the search input and results panel.
 * Closes when a result is clicked or the user dismisses.
 */
export function SearchOverlay({ open, onOpenChange }: SearchOverlayProps) {
  const { query, setQuery, results, isLoading, clear } = useSearch()

  const handleClose = () => {
    clear()
    onOpenChange(false)
  }

  const handleResultClick = () => {
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose()
    }}>
      <DialogContent className="top-0 translate-y-0 rounded-none border-0 sm:top-[50%] sm:translate-y-[-50%] sm:rounded-lg h-[100dvh] sm:h-auto sm:max-h-[80vh] flex flex-col gap-0 p-0">
        <DialogTitle className="sr-only">Search CrankDoc</DialogTitle>
        <DialogDescription className="sr-only">
          Search across bikes, DTC codes, glossary terms, diagnostic guides, and recalls
        </DialogDescription>
        <div className="p-4 pb-2">
          <SearchInput
            value={query}
            onChange={setQuery}
            onClear={clear}
            isOpen={!!results}
            resultsId="overlay-search-results"
            autoFocus
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          <SearchResults
            results={results}
            isLoading={isLoading}
            hasQuery={query.length >= 2}
            onResultClick={handleResultClick}
            id="overlay-search-results"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
