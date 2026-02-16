import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}))

vi.mock('@/lib/recalls/nhtsaClient', () => ({
  fetchNhtsaRecalls: vi.fn(),
  mapNhtsaToRecall: vi.fn(),
}))

import { createServerClient } from '@/lib/supabase/server'

function buildMockQuery(data: unknown[], count: number, error: unknown = null) {
  const ilikeFn = vi.fn()
  const eqFn = vi.fn()
  const orFn = vi.fn()
  const orderFn = vi.fn()
  const rangeFn = vi.fn(() => ({ data, error, count }))

  const chain = {
    ilike: ilikeFn.mockReturnThis(),
    eq: eqFn.mockReturnThis(),
    or: orFn.mockReturnThis(),
    order: orderFn.mockReturnThis(),
    range: rangeFn,
  }

  const mock = {
    from: vi.fn(() => ({
      select: vi.fn(() => chain),
    })),
    _chain: chain,
    _ilikeFn: ilikeFn,
    _eqFn: eqFn,
    _orFn: orFn,
  }

  return mock
}

describe('GET /api/recalls', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns paginated recalls with defaults', async () => {
    const mockRecalls = [
      {
        id: '1',
        nhtsa_campaign_number: '24V-001',
        data_source: 'nhtsa',
        manufacturer: 'Honda Motor Co.',
        make: 'HONDA',
        model: 'CBR600RR',
        model_year: 2021,
        component: 'ENGINE',
        summary: 'Engine may stall',
        consequence: null,
        remedy: null,
        notes: null,
        report_received_date: '2024-01-15',
        park_it: false,
        park_outside: false,
        created_at: '2024-01-01T00:00:00Z',
      },
    ]
    vi.mocked(createServerClient).mockReturnValue(buildMockQuery(mockRecalls, 1) as never)

    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/recalls')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.recalls).toHaveLength(1)
    expect(data.recalls[0].nhtsa_campaign_number).toBe('24V-001')
    expect(data.total).toBe(1)
    expect(data.page).toBe(1)
    expect(data.totalPages).toBe(1)
  })

  it('passes make filter with ilike', async () => {
    const mock = buildMockQuery([], 0)
    vi.mocked(createServerClient).mockReturnValue(mock as never)

    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/recalls?make=HONDA')
    await GET(request)

    expect(mock._ilikeFn).toHaveBeenCalledWith('make', 'HONDA')
  })

  it('passes model filter with ilike and wildcard', async () => {
    const mock = buildMockQuery([], 0)
    vi.mocked(createServerClient).mockReturnValue(mock as never)

    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/recalls?model=CBR')
    await GET(request)

    expect(mock._ilikeFn).toHaveBeenCalledWith('model', '%CBR%')
  })

  it('passes year filter with eq', async () => {
    const mock = buildMockQuery([], 0)
    vi.mocked(createServerClient).mockReturnValue(mock as never)

    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/recalls?year=2021')
    await GET(request)

    expect(mock._eqFn).toHaveBeenCalledWith('model_year', 2021)
  })

  it('passes text search query with or filter', async () => {
    const mock = buildMockQuery([], 0)
    vi.mocked(createServerClient).mockReturnValue(mock as never)

    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/recalls?q=engine')
    await GET(request)

    expect(mock._orFn).toHaveBeenCalledWith(
      'component.ilike.%engine%,summary.ilike.%engine%,consequence.ilike.%engine%,nhtsa_campaign_number.ilike.%engine%'
    )
  })

  it('returns 500 on database error', async () => {
    vi.mocked(createServerClient).mockReturnValue(
      buildMockQuery(null as never, 0, { message: 'DB error' }) as never
    )

    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/recalls')
    const response = await GET(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Failed to fetch recalls')
  })

  it('clamps page to minimum of 1', async () => {
    vi.mocked(createServerClient).mockReturnValue(buildMockQuery([], 0) as never)

    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/recalls?page=-5')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.page).toBe(1)
  })

  it('returns empty results for no matches', async () => {
    vi.mocked(createServerClient).mockReturnValue(buildMockQuery([], 0) as never)

    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/recalls?q=ZZZZNOTFOUND')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.recalls).toHaveLength(0)
    expect(data.total).toBe(0)
    expect(data.totalPages).toBe(0)
  })
})
