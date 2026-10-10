import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cb1000r, cb1000rServiceIntervals } from '../src/lib/cb1000r'
import { createClient } from '@supabase/supabase-js'
import { planCB1000RImport, runCB1000RImport } from './add-cb1000r'

describe('additive CB1000R import', () => {
  it('adds the bike, manual, diagrams, photo and service rows to an empty catalogue', () => {
    const plan = planCB1000RImport([], [])
    expect(plan.motorcycles).toHaveLength(1)
    expect(plan.documents).toHaveLength(3)
    expect(plan.images).toHaveLength(1)
    expect(plan.intervals).toHaveLength(cb1000rServiceIntervals.length)
    expect(plan.documents.every(doc => doc.motorcycle_id === plan.motorcycles[0].id)).toBe(true)
  })
  it('reuses an existing bike and never rewrites other catalogue records', () => {
    const plan = planCB1000RImport([{ id: 'existing', make: 'Honda', model: 'CB1000R', year_start: 2008, year_end: 2008 }], [{ motorcycle_id: 'existing', file_url: '/diagrams/honda-cb1000r-2008.png' }])
    expect(plan.motorcycles).toEqual([])
    expect(plan.documents).toHaveLength(2)
    expect(plan.documents[0].motorcycle_id).toBe('existing')
  })
  it('is a no-op after successful import', () => {
    const first = planCB1000RImport([], [])
    expect(planCB1000RImport(first.motorcycles, first.documents, first.images, first.intervals)).toMatchObject({ motorcycles: [], updates: [], documents: [], images: [], intervals: [] })
  })
})

vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }))
vi.mock('dotenv', () => ({ config: vi.fn() }))

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-only-key')
})

it('defaults to preview without creating a database client', async () => {
  const output = vi.spyOn(console, 'log').mockImplementation(() => {})
  await runCB1000RImport()
  expect(createClient).not.toHaveBeenCalled()
  output.mockRestore()
})

it('refuses to apply without credentials', async () => {
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')
  await expect(runCB1000RImport(true)).rejects.toThrow('Missing database credentials')
  expect(createClient).not.toHaveBeenCalled()
})

it('stops before any write if the catalogue read fails', async () => {
  const insert = vi.fn()
  const chain = { eq: vi.fn(), data: null, error: { message: 'read denied' } }
  chain.eq.mockReturnValue(chain)
  vi.mocked(createClient).mockReturnValue({ from: () => ({ select: () => chain, insert }) } as never)
  await expect(runCB1000RImport(true)).rejects.toThrow('read denied')
  expect(insert).not.toHaveBeenCalled()
})

it('inserts missing records only, with the bike before its documents', async () => {
  const calls: string[] = []
  const client = { from: (table: string) => {
    const chain = { eq: vi.fn(), data: [], error: null }
    chain.eq.mockReturnValue(chain)
    return { select: () => chain, insert: vi.fn(async () => { calls.push(table); return { error: null } }) }
  } }
  vi.mocked(createClient).mockReturnValue(client as never)
  const output = vi.spyOn(console, 'log').mockImplementation(() => {})
  await runCB1000RImport(true)
  expect(calls).toEqual(['motorcycles', 'technical_documents', 'motorcycle_images', 'service_intervals'])
  output.mockRestore()
})


it('fills only missing specs on the exact supported bike and preserves its image', () => {
  const existing = { ...cb1000r, id: 'existing', horsepower: 123.4, torque_nm: null, image_url: '/my-bike.jpg' }
  const plan = planCB1000RImport([existing], [], [{ motorcycle_id: 'existing', image_url: '/my-bike.jpg', is_primary: true }])
  expect(plan.updates).toEqual([{ id: 'existing', values: { torque_nm: 99 } }])
  expect(plan.images[0].is_primary).toBe(false)
  expect(plan.intervals.every(item => item.motorcycle_id === 'existing')).toBe(true)
})

it('does not backfill a different model-year record', () => {
  const plan = planCB1000RImport([{ ...cb1000r, id: 'later', year_start: 2018, year_end: 2018 }], [])
  expect(plan.updates).toEqual([])
  expect(plan.motorcycles[0].id).toBe(cb1000r.id)
})

it('recovers missing records after a partial import without duplicating existing rows', () => {
  const first = planCB1000RImport([], [])
  const retry = planCB1000RImport(first.motorcycles, first.documents, first.images, first.intervals.slice(0, 5))
  expect(retry.motorcycles).toEqual([])
  expect(retry.images).toEqual([])
  expect(retry.documents).toEqual([])
  expect(retry.intervals).toHaveLength(first.intervals.length - 5)
})

it('stops before writes if any supporting-table read fails', async () => {
  const insert = vi.fn()
  vi.mocked(createClient).mockReturnValue({ from: (table: string) => {
    const chain = { eq: vi.fn(), data: [], error: table === 'service_intervals' ? { message: 'interval read denied' } : null }
    chain.eq.mockReturnValue(chain)
    return { select: () => chain, insert }
  } } as never)
  await expect(runCB1000RImport(true)).rejects.toThrow('interval read denied')
  expect(insert).not.toHaveBeenCalled()
})

it('does not infer unrestricted torque for a bike with a different power rating', () => {
  const plan = planCB1000RImport([{ ...cb1000r, horsepower: 103.3, torque_nm: null }], [])
  expect(plan.updates).toEqual([])
})

it('applies missing specifications only to the matched bike before adding supporting records', async () => {
  const calls: string[] = []
  const existing = { ...cb1000r, id: 'existing', torque_nm: null }
  const eq = vi.fn(async (column: string, id: string) => {
    expect(column).toBe('id')
    expect(id).toBe('existing')
    calls.push('update existing')
    return { error: null }
  })
  const update = vi.fn((values: unknown) => {
    expect(values).toEqual({ torque_nm: 99 })
    return { eq }
  })
  vi.mocked(createClient).mockReturnValue({ from: (table: string) => {
    const chain = { eq: vi.fn(), data: table === 'motorcycles' ? [existing] : [], error: null }
    chain.eq.mockReturnValue(chain)
    return { select: () => chain, update, insert: vi.fn(async () => { calls.push(table); return { error: null } }) }
  } } as never)
  const output = vi.spyOn(console, 'log').mockImplementation(() => {})
  await runCB1000RImport(true)
  expect(update).toHaveBeenCalledOnce()
  expect(calls).toEqual(['update existing', 'technical_documents', 'motorcycle_images', 'service_intervals'])
  output.mockRestore()
})

it('stops supporting-record writes when a bike specification update fails', async () => {
  const insert = vi.fn()
  vi.mocked(createClient).mockReturnValue({ from: (table: string) => {
    const chain = { eq: vi.fn(), data: table === 'motorcycles' ? [{ ...cb1000r, torque_nm: null }] : [], error: null }
    chain.eq.mockReturnValue(chain)
    return { select: () => chain, insert, update: () => ({ eq: async () => ({ error: { message: 'update denied' } }) }) }
  } } as never)
  await expect(runCB1000RImport(true)).rejects.toThrow('update denied')
  expect(insert).not.toHaveBeenCalled()
})
