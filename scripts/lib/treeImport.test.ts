import { describe, it, expect, vi } from 'vitest'
import { findExistingTree, selectTreeFiles } from './treeImport'

const ALL = ['bmw-wont-start.json', 'universal-wont-start.json', 'yamaha-idle.json']

describe('selectTreeFiles', () => {
  it('imports every file when none are named', () => {
    expect(selectTreeFiles(ALL, [])).toEqual({ files: ALL, unknown: [] })
  })

  it('imports only the named files, with or without the .json ending', () => {
    expect(selectTreeFiles(ALL, ['yamaha-idle', 'bmw-wont-start.json'])).toEqual({
      files: ['bmw-wont-start.json', 'yamaha-idle.json'],
      unknown: [],
    })
  })

  it('reports names that match no file', () => {
    expect(selectTreeFiles(ALL, ['typo.json'])).toEqual({ files: [], unknown: ['typo.json'] })
  })
})

/** Fake Supabase client that records which filters the lookup applied. */
function fakeSupabase(result: { data: unknown; error: unknown }) {
  const calls: unknown[][] = []
  const query = {
    select: (...args: unknown[]) => (calls.push(['select', ...args]), query),
    eq: (...args: unknown[]) => (calls.push(['eq', ...args]), query),
    is: (...args: unknown[]) => (calls.push(['is', ...args]), query),
    in: (...args: unknown[]) => (calls.push(['in', ...args]), query),
    limit: vi.fn().mockResolvedValue(result),
  }
  return { client: { from: vi.fn(() => query) }, calls }
}

describe('findExistingTree', () => {
  it('matches a universal guide with IS NULL, never with = null', async () => {
    const { client, calls } = fakeSupabase({ data: [{ id: 'tree-1' }], error: null })
    await expect(findExistingTree(client, "Won't Start", [])).resolves.toEqual({ id: 'tree-1' })
    expect(calls).toContainEqual(['is', 'motorcycle_id', null])
    expect(calls).not.toContainEqual(['eq', 'motorcycle_id', null])
  })

  it('looks across all generation rows of a model', async () => {
    const { client, calls } = fakeSupabase({ data: [{ id: 'tree-2' }], error: null })
    await findExistingTree(client, 'Idle', ['gen-1', 'gen-2'])
    expect(calls).toContainEqual(['in', 'motorcycle_id', ['gen-1', 'gen-2']])
    expect(calls).toContainEqual(['eq', 'title', 'Idle'])
  })

  it('returns null when the guide is not in the database yet', async () => {
    const { client } = fakeSupabase({ data: [], error: null })
    await expect(findExistingTree(client, 'New guide', [])).resolves.toBeNull()
  })

  it('throws instead of inserting a duplicate when the lookup fails', async () => {
    const { client } = fakeSupabase({ data: null, error: { message: 'timeout' } })
    await expect(findExistingTree(client, 'Idle', [])).rejects.toThrow('timeout')
  })
})
