import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mapNhtsaToRecall, fetchNhtsaRecalls } from './nhtsaClient'
import type { NhtsaRecallResult, NhtsaRecallResponse } from './nhtsaClient'

/**
 * Helper: builds a fully populated NhtsaRecallResult for testing.
 */
function buildNhtsaResult(
  overrides: Partial<NhtsaRecallResult> = {}
): NhtsaRecallResult {
  return {
    NHTSACampaignNumber: '24V-123',
    Manufacturer: 'Honda Motor Co.',
    Component: 'FUEL SYSTEM',
    Summary: 'Fuel line may crack under pressure.',
    Consequence: 'Fuel leak may cause fire.',
    Remedy: 'Dealers will replace the fuel line.',
    Notes: 'Owners may contact Honda at 1-800-999-1009.',
    ReportReceivedDate: '20240315',
    ModelYear: 2023,
    Make: 'HONDA',
    Model: 'CBR600RR',
    parkIt: false,
    parkOutSide: false,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// mapNhtsaToRecall
// ---------------------------------------------------------------------------

describe('mapNhtsaToRecall', () => {
  it('correctly maps all fields from NHTSA PascalCase to snake_case Insert', () => {
    const raw = buildNhtsaResult()
    const result = mapNhtsaToRecall(raw)

    expect(result).toEqual({
      nhtsa_campaign_number: '24V-123',
      data_source: 'nhtsa',
      manufacturer: 'Honda Motor Co.',
      make: 'HONDA',
      model: 'CBR600RR',
      model_year: 2023,
      component: 'FUEL SYSTEM',
      summary: 'Fuel line may crack under pressure.',
      consequence: 'Fuel leak may cause fire.',
      remedy: 'Dealers will replace the fuel line.',
      notes: 'Owners may contact Honda at 1-800-999-1009.',
      report_received_date: '20240315',
      park_it: false,
      park_outside: false,
    })
  })

  it('handles null/empty optional fields gracefully', () => {
    const raw = buildNhtsaResult({
      Component: null,
      Summary: null,
      Consequence: null,
      Remedy: null,
      Notes: null,
      ReportReceivedDate: null,
    })

    const result = mapNhtsaToRecall(raw)

    expect(result.component).toBeNull()
    expect(result.summary).toBeNull()
    expect(result.consequence).toBeNull()
    expect(result.remedy).toBeNull()
    expect(result.notes).toBeNull()
    expect(result.report_received_date).toBeNull()
  })

  it('converts parkIt "Y" string to true', () => {
    const raw = buildNhtsaResult({ parkIt: 'Y' })
    const result = mapNhtsaToRecall(raw)
    expect(result.park_it).toBe(true)
  })

  it('converts parkIt "N" string to false', () => {
    const raw = buildNhtsaResult({ parkIt: 'N' })
    const result = mapNhtsaToRecall(raw)
    expect(result.park_it).toBe(false)
  })

  it('converts parkOutSide "Y" string to true', () => {
    const raw = buildNhtsaResult({ parkOutSide: 'Y' })
    const result = mapNhtsaToRecall(raw)
    expect(result.park_outside).toBe(true)
  })

  it('converts parkOutSide "N" string to false', () => {
    const raw = buildNhtsaResult({ parkOutSide: 'N' })
    const result = mapNhtsaToRecall(raw)
    expect(result.park_outside).toBe(false)
  })

  it('passes through boolean true for parkIt', () => {
    const raw = buildNhtsaResult({ parkIt: true })
    const result = mapNhtsaToRecall(raw)
    expect(result.park_it).toBe(true)
  })

  it('passes through boolean false for parkOutSide', () => {
    const raw = buildNhtsaResult({ parkOutSide: false })
    const result = mapNhtsaToRecall(raw)
    expect(result.park_outside).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// fetchNhtsaRecalls
// ---------------------------------------------------------------------------

describe('fetchNhtsaRecalls', () => {
  let mockFetch: ReturnType<typeof vi.fn<(input: string | URL | Request, init?: RequestInit) => Promise<Response>>>
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    mockFetch = vi.fn<(input: string | URL | Request, init?: RequestInit) => Promise<Response>>()
    vi.useFakeTimers()
    globalThis.fetch = mockFetch
  })

  afterEach(() => {
    vi.useRealTimers()
    globalThis.fetch = originalFetch
  })

  /**
   * Helper: creates a mock Response with the given JSON body.
   */
  function jsonResponse(body: NhtsaRecallResponse): Response {
    return {
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
    } as Response
  }

  /**
   * Helper: creates a mock failed Response.
   */
  function errorResponse(status: number): Response {
    return {
      ok: false,
      status,
      json: () => Promise.resolve({}),
    } as Response
  }

  it('returns results on a successful first-attempt fetch', async () => {
    const nhtsaResult = buildNhtsaResult()
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ Count: 1, results: [nhtsaResult] })
    )

    const results = await fetchNhtsaRecalls('HONDA', 'CBR600RR', 2023)

    expect(results).toHaveLength(1)
    expect(results[0].NHTSACampaignNumber).toBe('24V-123')
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('make=HONDA')
    )
  })

  it('retries on failure and succeeds on a later attempt', async () => {
    const nhtsaResult = buildNhtsaResult()

    // First attempt fails, second succeeds
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ Count: 1, results: [nhtsaResult] })
    )

    const promise = fetchNhtsaRecalls('HONDA', 'CBR600RR', 2023)

    // Advance past the first backoff delay (500ms)
    await vi.advanceTimersByTimeAsync(600)

    const results = await promise

    expect(results).toHaveLength(1)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('returns empty array after all retries fail', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    const promise = fetchNhtsaRecalls('HONDA', 'CBR600RR', 2023)

    // Advance through all backoff delays (500 + 1000 + extra)
    await vi.advanceTimersByTimeAsync(600)
    await vi.advanceTimersByTimeAsync(1100)
    await vi.advanceTimersByTimeAsync(2100)

    const results = await promise

    expect(results).toEqual([])
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('retries on non-ok HTTP responses', async () => {
    const nhtsaResult = buildNhtsaResult()

    // First attempt returns 500, second succeeds
    mockFetch.mockResolvedValueOnce(errorResponse(500))
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ Count: 1, results: [nhtsaResult] })
    )

    const promise = fetchNhtsaRecalls('HONDA', 'CBR600RR', 2023)

    await vi.advanceTimersByTimeAsync(600)

    const results = await promise

    expect(results).toHaveLength(1)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('returns empty array when Count is 0', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ Count: 0, results: [] })
    )

    const results = await fetchNhtsaRecalls('HONDA', 'CBR600RR', 2023)

    expect(results).toEqual([])
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('encodes make and model in the URL', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ Count: 0, results: [] })
    )

    await fetchNhtsaRecalls('HARLEY-DAVIDSON', 'STREET BOB', 2022)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('make=HARLEY-DAVIDSON')
    )
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('model=STREET%20BOB')
    )
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('modelYear=2022')
    )
  })
})
