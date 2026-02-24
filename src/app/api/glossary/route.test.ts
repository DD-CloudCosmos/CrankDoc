import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}))

import { createServerClient } from '@/lib/supabase/server'

function buildMockQuery(data: unknown[], count: number, error: unknown = null) {
  const orFn = vi.fn()
  const eqFn = vi.fn()
  const ilikeFn = vi.fn()
  const orderFn = vi.fn()
  const rangeFn = vi.fn(() => ({ data, error, count }))

  const chain = {
    or: orFn.mockReturnThis(),
    eq: eqFn.mockReturnThis(),
    ilike: ilikeFn.mockReturnThis(),
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
    _ilikeFn: ilikeFn,
  }

  return mock
}

describe('GET /api/glossary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns paginated glossary terms with defaults', async () => {
    const mockTerms = [
      { id: '1', term: 'Carburetor', slug: 'carburetor', definition: 'A device that mixes air and fuel', category: 'Fuel', subcategory: null, aliases: null, related_terms: null, illustration_url: null, applies_to: null, difficulty: null, created_at: '2024-01-01T00:00:00Z' },
    ]
    vi.mocked(createServerClient).mockReturnValue(buildMockQuery(mockTerms, 1) as never)

    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/glossary')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.terms).toHaveLength(1)
    expect(data.terms[0].term).toBe('Carburetor')
    expect(data.total).toBe(1)
    expect(data.page).toBe(1)
    expect(data.totalPages).toBe(1)
  })

  it('returns correct pagination metadata', async () => {
    vi.mocked(createServerClient).mockReturnValue(buildMockQuery([], 90) as never)

    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/glossary?page=2&limit=30')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.page).toBe(2)
    expect(data.totalPages).toBe(3)
    expect(data.total).toBe(90)
  })

  it('passes search query to the or filter', async () => {
    const mock = buildMockQuery([], 0)
    vi.mocked(createServerClient).mockReturnValue(mock as never)

    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/glossary?q=carburetor')
    await GET(request)

    expect(mock._orFn).toHaveBeenCalledWith('term.ilike.%carburetor%,definition.ilike.%carburetor%')
  })

  it('passes category filter to the eq filter', async () => {
    const mock = buildMockQuery([], 0)
    vi.mocked(createServerClient).mockReturnValue(mock as never)

    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/glossary?category=Engine')
    await GET(request)

    expect(mock._eqFn).toHaveBeenCalledWith('category', 'Engine')
  })

  it('passes letter filter to the ilike filter', async () => {
    const mock = buildMockQuery([], 0)
    vi.mocked(createServerClient).mockReturnValue(mock as never)

    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/glossary?letter=C')
    await GET(request)

    expect(mock._ilikeFn).toHaveBeenCalledWith('term', 'C%')
  })

  it('applies multiple filters together', async () => {
    const mock = buildMockQuery([], 0)
    vi.mocked(createServerClient).mockReturnValue(mock as never)

    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/glossary?category=Fuel&letter=C')
    await GET(request)

    expect(mock._eqFn).toHaveBeenCalledWith('category', 'Fuel')
    expect(mock._ilikeFn).toHaveBeenCalledWith('term', 'C%')
  })

  it('returns empty results for no matches', async () => {
    vi.mocked(createServerClient).mockReturnValue(buildMockQuery([], 0) as never)

    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/glossary?q=ZZZZNOTFOUND')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.terms).toHaveLength(0)
    expect(data.total).toBe(0)
    expect(data.totalPages).toBe(0)
  })

  it('returns 500 on database error', async () => {
    vi.mocked(createServerClient).mockReturnValue(
      buildMockQuery(null as never, 0, { message: 'DB error' }) as never
    )

    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/glossary')
    const response = await GET(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Failed to fetch glossary terms')
  })

  it('clamps page to minimum of 1', async () => {
    vi.mocked(createServerClient).mockReturnValue(buildMockQuery([], 0) as never)

    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/glossary?page=-5')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.page).toBe(1)
  })
})
