import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}))

import { createServerClient } from '@/lib/supabase/server'

describe('GET /api/recalls/filters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns distinct makes, models, and years sorted', async () => {
    const selectMock = vi.fn()
    const client = {
      from: vi.fn(() => ({ select: selectMock })),
    }

    // First call: makes
    selectMock.mockResolvedValueOnce({
      data: [{ make: 'Honda' }, { make: 'BMW' }, { make: 'Honda' }],
      error: null,
    })
    // Second call: models
    selectMock.mockResolvedValueOnce({
      data: [{ model: 'CBR600RR' }, { model: 'R 1250 GS' }],
      error: null,
    })
    // Third call: years
    selectMock.mockResolvedValueOnce({
      data: [{ model_year: 2023 }, { model_year: 2021 }, { model_year: 2023 }],
      error: null,
    })

    vi.mocked(createServerClient).mockReturnValue(client as never)

    const response = await GET()
    const data = await response.json()

    expect(data.makes).toEqual(['BMW', 'Honda'])
    expect(data.models).toEqual(['CBR600RR', 'R 1250 GS'])
    expect(data.years).toEqual([2023, 2021])
  })

  it('returns 500 on supabase error', async () => {
    const client = {
      from: vi.fn(() => ({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'DB error' },
        }),
      })),
    }
    vi.mocked(createServerClient).mockReturnValue(client as never)

    const response = await GET()
    expect(response.status).toBe(500)
  })
})
