'use client'

import { useState, useEffect, useRef, useCallback, Fragment } from 'react'
import { DtcSearch } from '@/components/DtcSearch'
import { DtcCategoryFilter } from '@/components/DtcCategoryFilter'
import { DtcManufacturerFilter } from '@/components/DtcManufacturerFilter'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table'
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import type { DtcCode } from '@/types/database.types'

interface DtcApiResponse {
  codes: DtcCode[]
  total: number
  page: number
  totalPages: number
}

const SEVERITY_CONFIG: Record<string, { label: string; dotClass: string; badgeClass: string }> = {
  low: {
    label: 'Low',
    dotClass: 'bg-green-500',
    badgeClass: 'border-green-500/30 text-green-400',
  },
  medium: {
    label: 'Medium',
    dotClass: 'bg-amber-500',
    badgeClass: 'border-amber-500/30 text-amber-400',
  },
  high: {
    label: 'High',
    dotClass: 'bg-orange-500',
    badgeClass: 'border-orange-500/30 text-orange-400',
  },
  critical: {
    label: 'Critical',
    dotClass: 'bg-red-500',
    badgeClass: 'border-red-500/30 text-red-400',
  },
}

export function DtcCodeList() {
  const [codes, setCodes] = useState<DtcCode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchCodes = useCallback(async (q: string, cat: string, mfr: string, p: number) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (cat) params.set('category', cat)
      if (mfr) params.set('manufacturer', mfr)
      params.set('page', String(p))
      params.set('limit', '20')

      const response = await fetch(`/api/dtc?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch DTC codes')
      }

      const data: DtcApiResponse = await response.json()
      setCodes(data.codes)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch {
      setError('Failed to load DTC codes. Please try again.')
      setCodes([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCodes(searchQuery, category, manufacturer, page)
  }, [searchQuery, category, manufacturer, page, fetchCodes])

  const handleSearch = (query: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    debounceTimer.current = setTimeout(() => {
      setSearchQuery(query)
      setPage(1)
    }, 300)
  }

  const handleCategoryChange = (cat: string) => {
    setCategory(cat)
    setPage(1)
  }

  const handleManufacturerChange = (mfr: string) => {
    setManufacturer(mfr)
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
      <DtcSearch onSearch={handleSearch} />
      <DtcCategoryFilter activeCategory={category} onChange={handleCategoryChange} />
      <DtcManufacturerFilter activeManufacturer={manufacturer} onChange={handleManufacturerChange} />

      {loading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading DTC codes...</span>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && codes.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-foreground">
            {searchQuery || category || manufacturer ? 'No DTC codes match your search' : 'No DTC codes available'}
          </p>
        </div>
      )}

      {!loading && !error && codes.length > 0 && (
        <>
          <p className="text-sm text-foreground">
            Showing {codes.length} of {total} codes
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="hidden sm:table-cell">Manufacturer</TableHead>
                <TableHead className="hidden sm:table-cell">Severity</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map((code) => {
                const isExpanded = expandedIds.has(code.id)
                const severityConfig = code.severity ? SEVERITY_CONFIG[code.severity] : null

                return (
                  <Fragment key={code.id}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() => toggleExpanded(code.id)}
                      data-testid="dtc-row"
                    >
                      <TableCell className="w-8 pr-0">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="font-mono font-medium">{code.code}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {code.manufacturer && (
                          <Badge variant="secondary" className="text-xs">
                            {code.manufacturer}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {severityConfig && (
                          <Badge variant="outline" className={severityConfig.badgeClass}>
                            <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${severityConfig.dotClass}`} />
                            {severityConfig.label}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {code.category && (
                          <Badge variant="outline">{code.category}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{code.description}</TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${code.id}-detail`} data-testid="dtc-detail">
                        <TableCell />
                        <TableCell colSpan={5} className="bg-muted/30">
                          <div className="space-y-3 py-2">
                            <p className="text-sm text-foreground">{code.description}</p>

                            {/* Mobile-only: show manufacturer, severity, category */}
                            <div className="flex flex-wrap gap-2 sm:hidden">
                              {code.manufacturer && (
                                <Badge variant="secondary" className="text-xs">
                                  {code.manufacturer}
                                </Badge>
                              )}
                              {severityConfig && (
                                <Badge variant="outline" className={severityConfig.badgeClass}>
                                  <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${severityConfig.dotClass}`} />
                                  {severityConfig.label}
                                </Badge>
                              )}
                              {code.category && (
                                <Badge variant="outline">{code.category}</Badge>
                              )}
                            </div>

                            {code.system && (
                              <p className="text-sm">
                                <span className="font-medium text-muted-foreground">System:</span>{' '}
                                <span className="text-foreground">{code.system}</span>
                              </p>
                            )}

                            {code.diagnostic_method && (
                              <p className="text-sm">
                                <span className="font-medium text-muted-foreground">Read with:</span>{' '}
                                <span className="text-foreground">{code.diagnostic_method}</span>
                              </p>
                            )}

                            {code.common_causes && code.common_causes.length > 0 && (
                              <div>
                                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                                  Common Causes
                                </p>
                                <ul className="space-y-1">
                                  {code.common_causes.map((cause) => (
                                    <li key={cause} className="text-sm text-foreground">
                                      {cause}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {code.fix_reference && (
                              <div className="border-t border-border pt-3">
                                <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                                  Fix Reference
                                </p>
                                <p className="text-sm text-foreground">{code.fix_reference}</p>
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
