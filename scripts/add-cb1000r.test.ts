import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { planCB1000RImport, runCB1000RImport } from './add-cb1000r'

describe('additive CB1000R import', () => {
  it('adds the bike and two source documents to an empty catalogue', () => {
    const plan = planCB1000RImport([], [])
    expect(plan.motorcycles).toHaveLength(1)
    expect(plan.documents).toHaveLength(2)
    expect(plan.documents.every(doc => doc.motorcycle_id === plan.motorcycles[0].id)).toBe(true)
  })
  it('reuses an existing bike and never rewrites other catalogue records', () => {
    const plan = planCB1000RImport([{ id: 'existing', make: 'Honda', model: 'CB1000R', year_start: 2008, year_end: 2008 }], [{ motorcycle_id: 'existing', file_url: '/diagrams/honda-cb1000r-2008.png' }])
    expect(plan.motorcycles).toEqual([])
    expect(plan.documents).toHaveLength(1)
    expect(plan.documents[0].motorcycle_id).toBe('existing')
  })
  it('is a no-op after successful import', () => {
    const first = planCB1000RImport([], [])
    expect(planCB1000RImport(first.motorcycles, first.documents)).toMatchObject({ motorcycles: [], documents: [] })
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
  expect(calls).toEqual(['motorcycles', 'technical_documents'])
  output.mockRestore()
})
