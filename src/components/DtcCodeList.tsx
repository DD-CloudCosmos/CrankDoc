'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { DtcSearch } from '@/components/DtcSearch'
import { DtcCodeCard } from '@/components/DtcCodeCard'
import { DtcCategoryFilter } from '@/components/DtcCategoryFilter'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import type { DtcCode } from '@/types/database.types'

interface DtcApiResponse {
  codes: DtcCode[]
  total: number
  page: number
  totalPages: number
}

export function DtcCodeList() {
  const [codes, setCodes] = useState<DtcCode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchCodes = useCallback(async (q: string, cat: string, p: number) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (cat) params.set('category', cat)
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
    fetchCodes(searchQuery, category, page)
  }, [searchQuery, category, page, fetchCodes])

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

  return (
    <div className="space-y-4">
      <DtcSearch onSearch={handleSearch} />
      <DtcCategoryFilter activeCategory={category} onChange={handleCategoryChange} />

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
          <p className="text-muted-foreground">
            {searchQuery || category ? 'No DTC codes match your search' : 'No DTC codes available'}
          </p>
        </div>
      )}

      {!loading && !error && codes.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            Showing {codes.length} of {total} codes
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {codes.map((code) => (
              <DtcCodeCard key={code.id} dtcCode={code} />
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
