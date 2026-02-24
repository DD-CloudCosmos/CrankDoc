'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { GlossarySearch } from '@/components/GlossarySearch'
import { GlossaryAlphaFilter } from '@/components/GlossaryAlphaFilter'
import { GlossaryCategoryFilter } from '@/components/GlossaryCategoryFilter'
import { GlossaryTermCard } from '@/components/GlossaryTermCard'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import type { GlossaryTerm } from '@/types/database.types'

interface GlossaryApiResponse {
  terms: GlossaryTerm[]
  total: number
  page: number
  totalPages: number
}

export function GlossaryList() {
  const [terms, setTerms] = useState<GlossaryTerm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('')
  const [letter, setLetter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchTerms = useCallback(async (q: string, cat: string, ltr: string, p: number) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (cat) params.set('category', cat)
      if (ltr) params.set('letter', ltr)
      params.set('page', String(p))
      params.set('limit', '30')

      const response = await fetch(`/api/glossary?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch glossary terms')
      }

      const data: GlossaryApiResponse = await response.json()
      setTerms(data.terms)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch {
      setError('Failed to load glossary terms. Please try again.')
      setTerms([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTerms(searchQuery, category, letter, page)
  }, [searchQuery, category, letter, page, fetchTerms])

  const handleSearch = (query: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    debounceTimer.current = setTimeout(() => {
      setSearchQuery(query)
      setLetter('')
      setPage(1)
    }, 300)
  }

  const handleCategoryChange = (cat: string) => {
    setCategory(cat)
    setPage(1)
  }

  const handleLetterChange = (ltr: string) => {
    setLetter(ltr)
    setSearchQuery('')
    setPage(1)
  }

  const handleRelatedTermClick = (termName: string) => {
    setSearchQuery(termName)
    setLetter('')
    setPage(1)
  }

  return (
    <div className="space-y-4">
      <GlossarySearch onSearch={handleSearch} />
      <GlossaryAlphaFilter activeLetter={letter} onChange={handleLetterChange} />
      <GlossaryCategoryFilter activeCategory={category} onChange={handleCategoryChange} />

      {loading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading glossary terms...</span>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && terms.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-foreground">
            {searchQuery || category || letter ? 'No terms match your search' : 'No terms found'}
          </p>
        </div>
      )}

      {!loading && !error && terms.length > 0 && (
        <>
          <p className="text-sm text-foreground">
            Showing {terms.length} of {total} terms
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {terms.map((term) => (
              <GlossaryTermCard
                key={term.id}
                term={term}
                onRelatedTermClick={handleRelatedTermClick}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
