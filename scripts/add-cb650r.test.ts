import { createClient } from '@supabase/supabase-js'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { planCB650RImport, runCB650RImport } from './add-cb650r'
import { cb650r } from '../src/lib/cb650r'

describe('safe CB650RA import plan', () => {
  it('adds one supported bike, its illustration and all service rows to an empty catalogue', () => {
    const plan = planCB650RImport([])
    expect(plan.motorcycles).toHaveLength(1)
    expect(plan.intervals).toHaveLength(30)
    expect(plan.images).toHaveLength(1)
    expect(plan.updates).toHaveLength(0)
  })
  it('does not duplicate an exact model, image or schedule on repeated import', () => {
    const first = planCB650RImport([])
    const plan = planCB650RImport([cb650r], first.intervals, first.images)
    expect(plan).toEqual({ motorcycles: [], intervals: [], images: [], updates: [] })
  })
  it('preserves existing populated values, uses the saved id and fills only missing specs', () => {
    const plan = planCB650RImport([{ ...cb650r, id: 'existing', model: 'CB650R', horsepower: 47, torque_nm: null, fuel_capacity_liters: null }], [], [{ motorcycle_id: 'existing', image_url: '/old.png', is_primary: true }])
    expect(plan.motorcycles).toHaveLength(0)
    expect(plan.updates[0].values).toEqual({ fuel_capacity_liters: 15.4 })
    expect(plan.intervals.every(item => item.motorcycle_id === 'existing')).toBe(true)
    expect(plan.images[0].is_primary).toBe(false)
  })
  it('leaves other model years and broad year ranges untouched', () => {
    const plan = planCB650RImport([{ ...cb650r, year_start: 2021 }, { ...cb650r, year_start: 2024, year_end: 2024 }])
    expect(plan.motorcycles).toHaveLength(1)
    expect(plan.updates).toHaveLength(0)
  })
})

vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }))
vi.mock('dotenv', () => ({ config: vi.fn() }))

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://crankdoc-test.supabase.co')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-key')
  vi.spyOn(console, 'log').mockImplementation(() => {})
})
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks() })

function mockClient(readError?: string, existing = false, writeError = false) {
  const writes: string[] = []
  vi.mocked(createClient).mockReturnValue({ from: (table: string) => {
    const chain = { eq: vi.fn(), in: vi.fn(), data: table === 'motorcycles' && existing ? [{ ...cb650r, fuel_capacity_liters: null }] : [], error: table === readError ? { message: 'read denied' } : null }
    chain.eq.mockReturnValue(chain)
    chain.in.mockReturnValue(chain)
    return {
      select: () => chain,
      insert: vi.fn(async () => { writes.push(table); return { error: writeError ? { message: 'write denied' } : null } }),
      update: vi.fn(() => ({ eq: vi.fn(async () => { writes.push('update motorcycle'); return { error: null } }) })),
    }
  } } as never)
  return writes
}

it('shows an offline preview and refuses applying placeholder credentials', async () => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://your-project.supabase.co')
  await runCB650RImport()
  await expect(runCB650RImport(true)).rejects.toThrow('Configure the database')
  expect(createClient).not.toHaveBeenCalled()
})
it('reads a real catalogue for preview without writing', async () => {
  const writes = mockClient()
  await runCB650RImport()
  expect(writes).toEqual([])
  expect(createClient).toHaveBeenCalledOnce()
})
it.each(['motorcycles', 'service_intervals', 'motorcycle_images'])('stops before writes if reading %s fails', async table => {
  const writes = mockClient(table)
  await expect(runCB650RImport(true)).rejects.toThrow('read denied')
  expect(writes).toEqual([])
})
it('adds the parent bike before its service and image rows', async () => {
  const writes = mockClient()
  await runCB650RImport(true)
  expect(writes).toEqual(['motorcycles', 'service_intervals', 'motorcycle_images'])
})
it('updates missing fields on an existing exact bike before adding child records', async () => {
  const writes = mockClient(undefined, true)
  await runCB650RImport(true)
  expect(writes).toEqual(['update motorcycle', 'service_intervals', 'motorcycle_images'])
})
it('stops adding child records if creating the parent fails', async () => {
  const writes = mockClient(undefined, false, true)
  await expect(runCB650RImport(true)).rejects.toThrow('write denied')
  expect(writes).toEqual(['motorcycles'])
})
