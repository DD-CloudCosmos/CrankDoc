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
          {
            Make: 'Honda',
            Model: 'CBR600RR',
            ModelYear: '2020',
            VehicleType: 'MOTORCYCLE',
            DisplacementL: '0.599',
            EngineCylinders: '4',
            FuelTypePrimary: 'Gasoline',
            TransmissionStyle: 'Manual',
            ErrorCode: '0',
            ErrorText: '',
          },
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
