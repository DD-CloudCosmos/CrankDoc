import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('GET /api/vin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when VIN parameter is missing', async () => {
    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/vin')
    const response = await GET(request)
    expect(response.status).toBe(400)
  })

  it('returns 400 when VIN is not 17 characters', async () => {
    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/vin?vin=TOOSMALL')
    const response = await GET(request)
    expect(response.status).toBe(400)
  })

  it('returns decoded VIN data on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        Results: [
          { Variable: 'Make', Value: 'Honda' },
          { Variable: 'Model', Value: 'CBR600RR' },
          { Variable: 'Model Year', Value: '2020' },
          { Variable: 'Vehicle Type', Value: 'MOTORCYCLE' },
          { Variable: 'Displacement (L)', Value: '0.599' },
          { Variable: 'Engine Number of Cylinders', Value: '4' },
          { Variable: 'Fuel Type - Primary', Value: 'Gasoline' },
          { Variable: 'Transmission Style', Value: 'Manual' },
          { Variable: 'Error Code', Value: '0' },
          { Variable: 'Error Text', Value: '' },
        ],
      }),
    })

    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/vin?vin=12345678901234567')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.make).toBe('Honda')
    expect(data.model).toBe('CBR600RR')
    expect(data.year).toBe(2020)
  })
})
