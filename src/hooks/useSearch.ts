'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { SearchResponse } from '@/types/search.types'

type SearchStatus = 'idle' | 'loading' | 'success' | 'error'

interface UseSearchReturn {
  query: string
  setQuery: (q: string) => void
  results: SearchResponse | null
  status: SearchStatus
  isLoading: boolean
  error: string | null
  clear: () => void
}

const EMPTY_RESULTS: SearchResponse = {
  bikes: [],
  dtcCodes: [],
  glossaryTerms: [],
  diagnosticTrees: [],
  recalls: [],
}

/**
 * Cross-feature search hook with 300ms debounce and request cancellation.
 *
 * @param debounceMs - Debounce delay in milliseconds (default 300)
 * @returns Search state and controls
 */
export function useSearch(debounceMs = 300): UseSearchReturn {
  const [query, setQueryState] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [status, setStatus] = useState<SearchStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Debounce the query
  const setQuery = useCallback((q: string) => {
    setQueryState(q)

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    if (!q.trim() || q.trim().length < 2) {
      setDebouncedQuery('')
      setResults(null)
      setStatus('idle')
      setError(null)
      return
    }

    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(q.trim())
    }, debounceMs)
  }, [debounceMs])

  // Fetch when debouncedQuery changes
  useEffect(() => {
    if (!debouncedQuery) return

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    const fetchResults = async () => {
      setStatus('loading')
      setError(null)

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=3`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error('Search failed')
        }

        const data: SearchResponse = await response.json()
        setResults(data)
        setStatus('success')
      } catch (err) {
        // Ignore aborted requests
        if (err instanceof Error && err.name === 'AbortError') return

        setError('Search failed. Please try again.')
        setResults(EMPTY_RESULTS)
        setStatus('error')
      }
    }

    fetchResults()

    return () => {
      controller.abort()
    }
  }, [debouncedQuery])

  // Clear everything
  const clear = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setQueryState('')
    setDebouncedQuery('')
    setResults(null)
    setStatus('idle')
    setError(null)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    query,
    setQuery,
    results,
    status,
    isLoading: status === 'loading',
    error,
    clear,
  }
}
