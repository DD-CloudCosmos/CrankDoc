import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSearch } from './useSearch'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

const mockResponse = {
  bikes: [{ id: '1', title: 'Honda CBR', subtitle: '2003-2006', href: '/bikes/1', category: 'bikes' }],
  dtcCodes: [],
  glossaryTerms: [],
  diagnosticTrees: [],
  recalls: [],
}

describe('useSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts in idle state with no results', () => {
    const { result } = renderHook(() => useSearch())
    expect(result.current.query).toBe('')
    expect(result.current.results).toBeNull()
    expect(result.current.status).toBe('idle')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('does not fetch for queries shorter than 2 characters', () => {
    const { result } = renderHook(() => useSearch())

    act(() => {
      result.current.setQuery('a')
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.current.status).toBe('idle')
  })

  it('debounces the query before fetching', async () => {
    const { result } = renderHook(() => useSearch(300))

    act(() => {
      result.current.setQuery('hon')
    })

    // Not yet — still within debounce window
    expect(mockFetch).not.toHaveBeenCalled()

    // Advance past debounce
    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/search?q=hon'),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    )
  })

  it('returns results after successful fetch', async () => {
    const { result } = renderHook(() => useSearch(300))

    act(() => {
      result.current.setQuery('honda')
    })

    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    // Wait for the async fetch to resolve
    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(result.current.results).toEqual(mockResponse)
    expect(result.current.status).toBe('success')
  })

  it('clears state when clear is called', async () => {
    const { result } = renderHook(() => useSearch(300))

    act(() => {
      result.current.setQuery('honda')
    })

    await act(async () => {
      vi.advanceTimersByTime(300)
      await vi.runAllTimersAsync()
    })

    act(() => {
      result.current.clear()
    })

    expect(result.current.query).toBe('')
    expect(result.current.results).toBeNull()
    expect(result.current.status).toBe('idle')
  })

  it('resets to idle when query is cleared to empty', () => {
    const { result } = renderHook(() => useSearch())

    act(() => {
      result.current.setQuery('honda')
    })

    act(() => {
      result.current.setQuery('')
    })

    expect(result.current.status).toBe('idle')
    expect(result.current.results).toBeNull()
  })

  it('sets error state on fetch failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    const { result } = renderHook(() => useSearch(300))

    act(() => {
      result.current.setQuery('test')
    })

    await act(async () => {
      vi.advanceTimersByTime(300)
      await vi.runAllTimersAsync()
    })

    expect(result.current.status).toBe('error')
    expect(result.current.error).toBeTruthy()
  })
})
