import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}))

import { createServerClient } from '@/lib/supabase/server'

function buildMockQuery(data: unknown[], count: number, error: unknown = null) {
  const orFn = vi.fn()
  const eqFn = vi.fn()
  const orderFn = vi.fn()
  const rangeFn = vi.fn(() => ({ data, error, count }))

  const chain = {
    or: orFn.mockReturnThis(),
    eq: eqFn.mockReturnThis(),
    order: orderFn.mockReturnThis(),
    range: rangeFn,
  }

  const mock = {
    from: vi.fn(() => ({
      select: vi.fn(() => chain),
    })),
    _chain: chain,
    _orFn: orFn,
    _eqFn: eqFn,
  }

  return mock
}

describe('GET /api/dtc', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns paginated DTC codes with defaults', async () => {
    const mockCodes = [
      { id: '1', code: 'P0301', description: 'Cylinder 1 Misfire', category: 'powertrain', subcategory: 'ignition', severity: 'high', common_causes: ['Spark plug'], applies_to_makes: null, created_at: '2024-01-01T00:00:00Z' },
    ]
    vi.mocked(createServerClient).mockReturnValue(buildMockQuery(mockCodes, 1) as never)

    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/dtc')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.codes).toHaveLength(1)
    expect(data.codes[0].code).toBe('P0301')
    expect(data.total).toBe(1)
    expect(data.page).toBe(1)
    expect(data.totalPages).toBe(1)
  })

  it('returns correct pagination metadata', async () => {
    vi.mocked(createServerClient).mockReturnValue(buildMockQuery([], 45) as never)

    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/dtc?page=2&limit=20')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.page).toBe(2)
    expect(data.totalPages).toBe(3)
    expect(data.total).toBe(45)
  })

  it('passes search query to the or filter', async () => {
    const mock = buildMockQuery([], 0)
    vi.mocked(createServerClient).mockReturnValue(mock as never)

    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/dtc?q=misfire')
    await GET(request)

    expect(mock._orFn).toHaveBeenCalledWith('code.ilike.%misfire%,description.ilike.%misfire%')
  })

  it('passes category filter to the eq filter', async () => {
    const mock = buildMockQuery([], 0)
    vi.mocked(createServerClient).mockReturnValue(mock as never)

    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/dtc?category=powertrain')
    await GET(request)

    expect(mock._eqFn).toHaveBeenCalledWith('category', 'powertrain')
  })

  it('returns empty results for no matches', async () => {
    vi.mocked(createServerClient).mockReturnValue(buildMockQuery([], 0) as never)

    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/dtc?q=ZZZZNOTFOUND')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.codes).toHaveLength(0)
    expect(data.total).toBe(0)
    expect(data.totalPages).toBe(0)
  })

  it('returns 500 on database error', async () => {
    vi.mocked(createServerClient).mockReturnValue(
      buildMockQuery(null as never, 0, { message: 'DB error' }) as never
    )

    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/dtc')
    const response = await GET(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Failed to fetch DTC codes')
  })

  it('clamps page to minimum of 1', async () => {
    vi.mocked(createServerClient).mockReturnValue(buildMockQuery([], 0) as never)

    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/dtc?page=-5')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.page).toBe(1)
  })
})
