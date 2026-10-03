'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'
import { useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table'
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import type { Recall } from '@/types/database.types'

interface RecallsApiResponse {
  recalls: Recall[]
  total: number
  page: number
  totalPages: number
}

interface FiltersResponse {
  makes: string[]
  models: string[]
  years: number[]
}

function formatDate(dateString: string): string {
  const parts = dateString.split('-')
  if (parts.length === 3) {
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
  return dateString
}

export function RecallList() {
  const searchParams = useSearchParams()

  const [recalls, setRecalls] = useState<Recall[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [make, setMake] = useState(searchParams.get('make') || '')
  const [model, setModel] = useState(searchParams.get('model') || '')
  const [year, setYear] = useState(searchParams.get('year') || '')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Filter options
  const [filterMakes, setFilterMakes] = useState<string[]>([])
  const [filterModels, setFilterModels] = useState<string[]>([])
  const [filterYears, setFilterYears] = useState<number[]>([])

  // Fetch filter options on mount
  useEffect(() => {
    async function loadFilters() {
      try {
        const response = await fetch('/api/recalls/filters')
        if (response.ok) {
          const data: FiltersResponse = await response.json()
          setFilterMakes(data.makes)
          setFilterModels(data.models)
          setFilterYears(data.years)
        }
      } catch {
        // Silently fail — filters are optional
      }
    }
    loadFilters()
  }, [])

  const fetchRecalls = useCallback(async (mk: string, mdl: string, yr: string, p: number) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (mk) params.set('make', mk)
      if (mdl) params.set('model', mdl)
      if (yr) params.set('year', yr)
      params.set('page', String(p))
      params.set('limit', '20')

      const response = await fetch(`/api/recalls?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch recalls')
      }

      const data: RecallsApiResponse = await response.json()
      setRecalls(data.recalls)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch {
      setError('Failed to load recalls. Please try again.')
      setRecalls([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRecalls(make, model, year, page)
  }, [make, model, year, page, fetchRecalls])

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

  // Filter models based on selected make
  const filteredModels = make
    ? filterModels.filter(() => {
        // Models are global — we show all of them when a make is selected.
        // In a more complex app, we'd filter server-side. For now show all.
        return true
      })
    : filterModels

  const hasActiveFilters = make || model || year

  const clearFilters = () => {
    setMake('')
    setModel('')
    setYear('')
    setPage(1)
  }

  return (
    <div className="space-y-4">
      {/* Pill filters */}
      <div className="space-y-4" data-testid="recall-filters">

        {/* Make filter */}
        {filterMakes.length > 0 && (
        <div role="group" aria-label="Make">
          <p className="mb-1.5 text-[13px] uppercase text-muted-foreground">Make</p>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
            {filterMakes.map((m) => (
              <Button
                key={m}
                variant={make === m ? 'pill-active' : 'pill'}
                size="sm"
                className="shrink-0"
                aria-pressed={make === m}
                onClick={() => { setMake(make === m ? '' : m); setModel(''); setPage(1) }}
              >
                {m}
              </Button>
            ))}
          </div>
        </div>

        )}

        {/* Model filter — only shown when a make is selected */}
        {make && filteredModels.length > 0 && (
          <div role="group" aria-label="Model">
            <p className="mb-1.5 text-[13px] uppercase text-muted-foreground">Model</p>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
              {filteredModels.map((m) => (
                <Button
                  key={m}
                  variant={model === m ? 'pill-active' : 'pill'}
                  size="sm"
                  className="shrink-0"
                  aria-pressed={model === m}
                  onClick={() => { setModel(model === m ? '' : m); setPage(1) }}
                >
                  {m}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Year filter */}
        {filterYears.length > 0 && (
        <div role="group" aria-label="Year">
          <p className="mb-1.5 text-[13px] uppercase text-muted-foreground">Year</p>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
            {filterYears.map((y) => (
              <Button
                key={y}
                variant={year === String(y) ? 'pill-active' : 'pill'}
                size="sm"
                className="shrink-0"
                aria-pressed={year === String(y)}
                onClick={() => { setYear(year === String(y) ? '' : String(y)); setPage(1) }}
              >
                {y}
              </Button>
            ))}
          </div>
        </div>

        )}

        {/* Result count + clear */}
        {((!loading && !error && total > 0) || hasActiveFilters) && (
          <div className="flex min-h-[44px] items-center justify-between gap-4">
            {!loading && !error && total > 0 ? (
              <p className="text-[15px] text-muted-foreground" aria-live="polite">
                Showing {recalls.length} of {total} {total === 1 ? 'recall' : 'recalls'}
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

      {loading && (
        <div className="flex items-center justify-center p-8" aria-live="polite">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading recalls...</span>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-[14px] bg-danger-background p-8 text-center">
          <p className="text-danger-foreground">{error}</p>
        </div>
      )}

      {!loading && !error && recalls.length === 0 && (
        <div className="rounded-[20px] bg-card p-10 text-center shadow-card">
          <p className="text-muted-foreground">
            {make || model || year ? 'No recalls match your search' : 'No recalls available'}
          </p>
        </div>
      )}

      {!loading && !error && recalls.length > 0 && (
        <>
          <div className="overflow-hidden rounded-[20px] bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead>Campaign #</TableHead>
                <TableHead className="hidden md:table-cell">Vehicle</TableHead>
                <TableHead>Component</TableHead>
                <TableHead className="hidden lg:table-cell">Summary</TableHead>
                <TableHead className="w-20">Flags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recalls.map((recall) => {
                const isExpanded = expandedIds.has(recall.id)

                return (
                  <Fragment key={recall.id}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() => toggleExpanded(recall.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggleExpanded(recall.id)
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-expanded={isExpanded}
                      data-testid="recall-row"
                    >
                      <TableCell className="w-8 pr-0">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell whitespace-nowrap">
                        {recall.report_received_date ? formatDate(recall.report_received_date) : '---'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {recall.nhtsa_campaign_number}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {recall.make} {recall.model} {recall.model_year}
                      </TableCell>
                      <TableCell>{recall.component ?? '---'}</TableCell>
                      <TableCell className="hidden lg:table-cell max-w-xs truncate">
                        {recall.summary ?? '---'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {recall.park_it && (
                            <Badge variant="danger">
                              PARK IT
                            </Badge>
                          )}
                          {recall.park_outside && (
                            <Badge variant="caution">
                              PARK OUTSIDE
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow data-testid="recall-detail">
                        <TableCell />
                        <TableCell colSpan={6} className="bg-background/60">
                          <div className="space-y-3 py-2">
                            {/* Mobile-only: date and vehicle */}
                            <div className="flex flex-wrap gap-2 sm:hidden text-sm">
                              {recall.report_received_date && (
                                <span className="text-muted-foreground">{formatDate(recall.report_received_date)}</span>
                              )}
                              <span className="text-foreground">{recall.make} {recall.model} {recall.model_year}</span>
                            </div>

                            {recall.summary && (
                              <p className="text-sm text-foreground">{recall.summary}</p>
                            )}

                            {recall.consequence && (
                              <div>
                                <p className="text-sm font-medium text-caution-foreground">Consequence</p>
                                <p className="text-sm text-foreground">{recall.consequence}</p>
                              </div>
                            )}

                            {recall.remedy && (
                              <div>
                                <p className="text-sm font-medium text-safe-foreground">Remedy</p>
                                <p className="text-sm text-foreground">{recall.remedy}</p>
                              </div>
                            )}

                            {recall.notes && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Notes</p>
                                <p className="text-sm text-foreground">{recall.notes}</p>
                              </div>
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
