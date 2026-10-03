import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getGarageBikeData } from './garageBikes.server'
import { createServerClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}))

/** Minimal chainable stand-in for the Supabase query builder. */
function queryResult(data: unknown) {
  const builder: Record<string, unknown> = {}
  const chain = () => builder
  builder.select = chain
  builder.order = chain
  builder.eq = chain
  builder.then = (resolve: (value: { data: unknown; error: null }) => unknown) => resolve({ data, error: null })
  return builder
}

function mockTables(tables: Record<string, unknown>) {
  vi.mocked(createServerClient).mockReturnValue({
    from: (table: string) => queryResult(tables[table] ?? []),
  } as unknown as ReturnType<typeof createServerClient>)
}

describe('getGarageBikeData', () => {
  beforeEach(() => {
    vi.mocked(createServerClient).mockReset()
  })

  it('combines bikes, primary images and guide counts', async () => {
    mockTables({
      motorcycles: [
        { id: 'a', make: 'BMW', model: 'R 1250 GS' },
        { id: 'b', make: 'Yamaha', model: 'MT-07' },
      ],
      motorcycle_images: [{ motorcycle_id: 'a', image_url: 'https://x/a.jpg', alt_text: 'GS' }],
      diagnostic_trees: [
        { id: 't1', motorcycle_id: 'a' },
        { id: 't2', motorcycle_id: 'a' },
        { id: 't3', motorcycle_id: 'b' },
        { id: 't4', motorcycle_id: null },
      ],
    })

    const result = await getGarageBikeData()
    expect(result.universalTreeCount).toBe(1)
    expect(result.bikes).toEqual([
      { id: 'a', make: 'BMW', model: 'R 1250 GS', imageUrl: 'https://x/a.jpg', imageAlt: 'GS', treeCount: 2 },
      { id: 'b', make: 'Yamaha', model: 'MT-07', imageUrl: null, imageAlt: null, treeCount: 1 },
    ])
  })

  it('returns empty data instead of throwing when Supabase is unavailable', async () => {
    vi.mocked(createServerClient).mockImplementation(() => {
      throw new Error('Missing Supabase environment variables')
    })
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(getGarageBikeData()).resolves.toEqual({ bikes: [], universalTreeCount: 0 })
    spy.mockRestore()
  })
})
