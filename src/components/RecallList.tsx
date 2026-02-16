'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { RecallCard } from '@/components/RecallCard'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import type { Recall } from '@/types/database.types'

interface RecallsApiResponse {
  recalls: Recall[]
  total: number
  page: number
  totalPages: number
}

export function RecallList() {
  const [recalls, setRecalls] = useState<Recall[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const handleInputChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    debounceTimer.current = setTimeout(() => {
      setter(value)
      setPage(1)
    }, 300)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Make (e.g., Honda)"
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          onChange={handleInputChange(setMake)}
        />
        <input
          type="text"
          placeholder="Model (e.g., CBR600RR)"
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          onChange={handleInputChange(setModel)}
        />
        <input
          type="number"
          placeholder="Year"
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          onChange={handleInputChange(setYear)}
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading recalls...</span>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && recalls.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            {make || model || year ? 'No recalls match your search' : 'No recalls available'}
          </p>
        </div>
      )}

      {!loading && !error && recalls.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            Showing {recalls.length} of {total} recalls
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {recalls.map((recall) => (
              <RecallCard key={recall.id} recall={recall} />
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
