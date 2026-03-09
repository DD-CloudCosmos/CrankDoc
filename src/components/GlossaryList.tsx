'use client'

import { useState, useEffect, useRef, useCallback, Fragment } from 'react'
import { GlossarySearch } from '@/components/GlossarySearch'
import { GlossaryAlphaFilter } from '@/components/GlossaryAlphaFilter'
import { GlossaryCategoryFilter } from '@/components/GlossaryCategoryFilter'
import { GlossaryImageModal } from '@/components/GlossaryImageModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table'
import { ChevronRight, Loader2, ZoomIn } from 'lucide-react'
import type { GlossaryTerm } from '@/types/database.types'

interface GlossaryApiResponse {
  terms: GlossaryTerm[]
  total: number
  page: number
  totalPages: number
}

import { DIFFICULTY_STYLES } from '@/lib/badgeStyles'

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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [modalImage, setModalImage] = useState<{ url: string; term: string } | null>(null)
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

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="space-y-4">
      <GlossarySearch onSearch={handleSearch} />
      <GlossaryAlphaFilter activeLetter={letter} onChange={handleLetterChange} />
      <GlossaryCategoryFilter activeCategory={category} onChange={handleCategoryChange} />

      {loading && (
        <div className="flex items-center justify-center p-8" aria-live="polite">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading glossary terms...</span>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center" aria-live="polite">
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Term</TableHead>
                <TableHead className="hidden md:table-cell">Definition</TableHead>
                <TableHead className="hidden sm:table-cell w-[120px]">Category</TableHead>
                <TableHead className="hidden md:table-cell w-[120px]">Difficulty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {terms.map((term) => {
                const isExpanded = expandedIds.has(term.id)
                const difficultyStyle = term.difficulty ? DIFFICULTY_STYLES[term.difficulty] : null

                return (
                  <Fragment key={term.id}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() => toggleExpanded(term.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggleExpanded(term.id)
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-expanded={isExpanded}
                      data-testid="glossary-row"
                    >
                      <TableCell className="w-8 pr-0">
                        <ChevronRight
                          className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        />
                      </TableCell>
                      <TableCell className="font-semibold">{term.term}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-md truncate text-muted-foreground">
                        {term.definition}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="min-w-[80px]">{term.category}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {difficultyStyle && (
                          <Badge variant="outline" className={`min-w-[80px] ${difficultyStyle.badgeClass}`}>
                            {difficultyStyle.label}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${term.id}-detail`} data-testid="glossary-detail">
                        <TableCell />
                        <TableCell colSpan={4} className="bg-muted/30">
                          <div className="grid gap-6 py-2 md:grid-cols-[1fr,minmax(300px,400px)]">
                            <div className="space-y-3">
                              <p className="text-sm text-foreground">{term.definition}</p>

                              {/* Mobile-only: show category and difficulty */}
                              <div className="flex gap-2 md:hidden">
                                <Badge variant="outline">{term.category}</Badge>
                                {difficultyStyle && (
                                  <Badge variant="outline" className={difficultyStyle.badgeClass}>
                                    {difficultyStyle.label}
                                  </Badge>
                                )}
                              </div>

                              {term.aliases && term.aliases.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  Also known as: {term.aliases.join(', ')}
                                </p>
                              )}

                              {term.related_terms && term.related_terms.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-xs font-medium text-muted-foreground">See also:</span>
                                  {term.related_terms.map((related) => (
                                    <Button
                                      key={related}
                                      variant="ghost"
                                      size="sm"
                                      className="h-auto px-2 py-0.5 text-xs"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleRelatedTermClick(related)
                                      }}
                                    >
                                      {related}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {term.illustration_url && (
                              <button
                                type="button"
                                className="group relative cursor-zoom-in"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setModalImage({ url: term.illustration_url!, term: term.term })
                                }}
                                data-testid="glossary-illustration-button"
                              >
                                <img
                                  src={term.illustration_url}
                                  alt={term.term}
                                  className="w-full h-auto object-contain transition-transform group-hover:scale-105"
                                  style={{ aspectRatio: '3/2' }}
                                />
                                <span className="absolute bottom-2 right-2 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100">
                                  <ZoomIn className="h-4 w-4" aria-hidden="true" />
                                  <span className="sr-only">Zoom illustration</span>
                                </span>
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>

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

      {modalImage && (
        <GlossaryImageModal
          open={true}
          onClose={() => setModalImage(null)}
          imageUrl={modalImage.url}
          termName={modalImage.term}
        />
      )}
    </div>
  )
}
