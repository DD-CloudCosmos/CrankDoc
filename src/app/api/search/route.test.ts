import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'

// Mock Supabase
const mockSelect = vi.fn()
const mockOr = vi.fn()
const mockLimit = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => ({
    from: (table: string) => {
      mockFrom(table)
      return {
        select: (...args: unknown[]) => {
          mockSelect(table, ...args)
          return {
            or: (...orArgs: unknown[]) => {
              mockOr(table, ...orArgs)
              return {
                limit: (n: number) => {
                  mockLimit(table, n)
                  // Return different mock data based on table
                  if (table === 'motorcycles') {
                    return Promise.resolve({
                      data: [
                        {
                          id: 'bike-1',
                          make: 'Honda',
                          model: 'CBR600RR',
                          year_start: 2003,
                          year_end: 2006,
                          category: 'sport',
                        },
                      ],
                      error: null,
                    })
                  }
                  if (table === 'dtc_codes') {
                    return Promise.resolve({
                      data: [
                        {
                          id: 'dtc-1',
                          code: 'P0301',
                          description: 'Cylinder 1 misfire detected',
                          manufacturer: 'Honda',
                        },
                      ],
                      error: null,
                    })
                  }
                  if (table === 'glossary_terms') {
                    return Promise.resolve({
                      data: [
                        {
                          id: 'gl-1',
                          term: 'Carburetor',
                          definition: 'A device that blends air and fuel',
                          slug: 'carburetor',
                        },
                      ],
                      error: null,
                    })
                  }
                  if (table === 'diagnostic_trees') {
                    return Promise.resolve({
                      data: [
                        {
                          id: 'tree-1',
                          title: 'Engine Won\'t Start',
                          description: 'Diagnose no-start condition',
                          motorcycle_id: 'bike-1',
                        },
                      ],
                      error: null,
                    })
                  }
                  if (table === 'recalls') {
                    return Promise.resolve({
                      data: [
                        {
                          id: 'recall-1',
                          nhtsa_campaign_number: '24V-123',
                          make: 'Honda',
                          model: 'CBR600RR',
                          model_year: 2005,
                          summary: 'Brake line issue',
                        },
                      ],
                      error: null,
                    })
                  }
                  return Promise.resolve({ data: [], error: null })
                },
              }
            },
          }
        },
      }
    },
  }),
}))

function createRequest(params: Record<string, string>): Request {
  const url = new URL('http://localhost:3000/api/search')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return new Request(url.toString())
}

describe('GET /api/search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when q is missing', async () => {
    const response = await GET(createRequest({}))
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('required')
  })

  it('returns 400 when q is too short', async () => {
    const response = await GET(createRequest({ q: 'a' }))
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('at least 2 characters')
  })

  it('returns grouped results with correct shape', async () => {
    const response = await GET(createRequest({ q: 'honda' }))
    expect(response.status).toBe(200)
    const body = await response.json()

    // All 5 categories present
    expect(body).toHaveProperty('bikes')
    expect(body).toHaveProperty('dtcCodes')
    expect(body).toHaveProperty('glossaryTerms')
    expect(body).toHaveProperty('diagnosticTrees')
    expect(body).toHaveProperty('recalls')

    // Bikes result shape
    expect(body.bikes[0]).toEqual({
      id: 'bike-1',
      title: 'Honda CBR600RR',
      subtitle: '2003-2006 sport',
      href: '/bikes/bike-1',
      category: 'bikes',
    })

    // DTC result shape
    expect(body.dtcCodes[0]).toEqual({
      id: 'dtc-1',
      title: 'P0301',
      subtitle: 'Cylinder 1 misfire detected',
      href: '/dtc?q=P0301',
      category: 'dtcCodes',
    })
  })

  it('queries all 5 tables', async () => {
    await GET(createRequest({ q: 'test' }))
    expect(mockFrom).toHaveBeenCalledWith('motorcycles')
    expect(mockFrom).toHaveBeenCalledWith('dtc_codes')
    expect(mockFrom).toHaveBeenCalledWith('glossary_terms')
    expect(mockFrom).toHaveBeenCalledWith('diagnostic_trees')
    expect(mockFrom).toHaveBeenCalledWith('recalls')
  })

  it('respects custom limit parameter', async () => {
    await GET(createRequest({ q: 'test', limit: '5' }))
    expect(mockLimit).toHaveBeenCalledWith('motorcycles', 5)
    expect(mockLimit).toHaveBeenCalledWith('dtc_codes', 5)
  })

  it('clamps limit to max of 10', async () => {
    await GET(createRequest({ q: 'test', limit: '50' }))
    expect(mockLimit).toHaveBeenCalledWith('motorcycles', 10)
  })

  it('returns 400 for whitespace-only query', async () => {
    const response = await GET(createRequest({ q: '   ' }))
    expect(response.status).toBe(400)
  })
})
