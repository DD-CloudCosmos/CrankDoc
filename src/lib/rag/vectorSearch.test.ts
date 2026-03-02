import { describe, it, expect, vi } from 'vitest'
import { searchDocumentChunks } from './vectorSearch'
import type { VectorSearchParams } from './rag.types'

/**
 * Helper: builds a mock Supabase client with a configurable rpc method.
 */
function buildMockSupabase(rpcResult: { data: unknown; error: unknown }) {
  return {
    rpc: vi.fn().mockResolvedValue(rpcResult),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}

/**
 * Helper: builds a sample vector search result row as returned by Supabase RPC.
 */
function buildRpcRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'chunk-uuid-1',
    content: 'Valve clearance: Intake 0.16-0.19mm',
    section_title: 'Valve Clearance Specifications',
    section_hierarchy: ['Engine', 'Valve Train', 'Clearance'],
    page_numbers: [42, 43],
    content_type: 'spec_table',
    make: 'Honda',
    model: 'CBR600RR',
    similarity: 0.92,
    ...overrides,
  }
}

describe('searchDocumentChunks', () => {
  it('calls rpc with correct parameters and returns mapped results', async () => {
    const row = buildRpcRow()
    const supabase = buildMockSupabase({ data: [row], error: null })

    const params: VectorSearchParams = {
      queryEmbedding: [0.1, 0.2, 0.3],
      matchCount: 5,
      filters: {
        motorcycleId: 'moto-uuid',
        make: 'Honda',
        model: 'CBR600RR',
        contentType: 'spec_table',
      },
      similarityThreshold: 0.7,
    }

    const results = await searchDocumentChunks(supabase, params)

    expect(supabase.rpc).toHaveBeenCalledWith('match_document_chunks', {
      query_embedding: '[0.1,0.2,0.3]',
      match_count: 5,
      filter_motorcycle_id: 'moto-uuid',
      filter_make: 'Honda',
      filter_model: 'CBR600RR',
      filter_content_type: 'spec_table',
      similarity_threshold: 0.7,
    })

    expect(results).toHaveLength(1)
    expect(results[0]).toEqual({
      id: 'chunk-uuid-1',
      content: 'Valve clearance: Intake 0.16-0.19mm',
      sectionTitle: 'Valve Clearance Specifications',
      sectionHierarchy: ['Engine', 'Valve Train', 'Clearance'],
      pageNumbers: [42, 43],
      contentType: 'spec_table',
      make: 'Honda',
      model: 'CBR600RR',
      similarity: 0.92,
    })
  })

  it('uses default values when optional params are omitted', async () => {
    const supabase = buildMockSupabase({ data: [], error: null })

    const params: VectorSearchParams = {
      queryEmbedding: [0.1, 0.2],
    }

    await searchDocumentChunks(supabase, params)

    expect(supabase.rpc).toHaveBeenCalledWith('match_document_chunks', {
      query_embedding: '[0.1,0.2]',
      match_count: 10,
      filter_motorcycle_id: null,
      filter_make: null,
      filter_model: null,
      filter_content_type: null,
      similarity_threshold: 0.5,
    })
  })

  it('returns empty array when no results found', async () => {
    const supabase = buildMockSupabase({ data: [], error: null })

    const results = await searchDocumentChunks(supabase, {
      queryEmbedding: [0.1],
    })

    expect(results).toEqual([])
  })

  it('returns empty array when data is null', async () => {
    const supabase = buildMockSupabase({ data: null, error: null })

    const results = await searchDocumentChunks(supabase, {
      queryEmbedding: [0.1],
    })

    expect(results).toEqual([])
  })

  it('throws when rpc returns an error', async () => {
    const supabase = buildMockSupabase({
      data: null,
      error: { message: 'Function not found' },
    })

    await expect(
      searchDocumentChunks(supabase, { queryEmbedding: [0.1] })
    ).rejects.toThrow('Vector search failed: Function not found')
  })

  it('handles results with null metadata fields', async () => {
    const row = buildRpcRow({
      section_title: null,
      section_hierarchy: null,
      page_numbers: null,
      make: null,
      model: null,
    })

    const supabase = buildMockSupabase({ data: [row], error: null })

    const results = await searchDocumentChunks(supabase, {
      queryEmbedding: [0.1],
    })

    expect(results[0].sectionTitle).toBeNull()
    expect(results[0].sectionHierarchy).toBeNull()
    expect(results[0].pageNumbers).toBeNull()
    expect(results[0].make).toBeNull()
    expect(results[0].model).toBeNull()
  })

  it('maps multiple results correctly', async () => {
    const row1 = buildRpcRow({ id: 'chunk-1', similarity: 0.95 })
    const row2 = buildRpcRow({ id: 'chunk-2', similarity: 0.85 })

    const supabase = buildMockSupabase({ data: [row1, row2], error: null })

    const results = await searchDocumentChunks(supabase, {
      queryEmbedding: [0.1],
    })

    expect(results).toHaveLength(2)
    expect(results[0].id).toBe('chunk-1')
    expect(results[0].similarity).toBe(0.95)
    expect(results[1].id).toBe('chunk-2')
    expect(results[1].similarity).toBe(0.85)
  })
})
