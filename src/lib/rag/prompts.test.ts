import { describe, it, expect } from 'vitest'
import {
  CRANKDOC_RAG_SYSTEM_PROMPT,
  formatChunksAsContext,
  assembleRagPrompt,
} from './prompts'
import type { VectorSearchResult } from './rag.types'

/**
 * Helper: builds a sample VectorSearchResult for testing.
 */
function buildChunk(overrides: Partial<VectorSearchResult> = {}): VectorSearchResult {
  return {
    id: 'chunk-uuid-1',
    content: 'Intake valve clearance: 0.16-0.19mm\nExhaust valve clearance: 0.22-0.27mm',
    sectionTitle: 'Valve Clearance Specifications',
    sectionHierarchy: ['Engine', 'Valve Train', 'Clearance'],
    pageNumbers: [42, 43],
    contentType: 'spec_table',
    make: 'Honda',
    model: 'CBR600RR',
    similarity: 0.92,
    ...overrides,
  }
}

describe('CRANKDOC_RAG_SYSTEM_PROMPT', () => {
  it('contains safety warning instructions', () => {
    expect(CRANKDOC_RAG_SYSTEM_PROMPT).toContain('safety warnings')
  })

  it('instructs to cite sources', () => {
    expect(CRANKDOC_RAG_SYSTEM_PROMPT).toContain('cite the source section')
  })

  it('instructs to only use provided context', () => {
    expect(CRANKDOC_RAG_SYSTEM_PROMPT).toContain('ONLY the provided reference material')
  })

  it('instructs not to bypass safety systems', () => {
    expect(CRANKDOC_RAG_SYSTEM_PROMPT).toContain('Never instruct users to bypass safety systems')
  })

  it('instructs to use exact values', () => {
    expect(CRANKDOC_RAG_SYSTEM_PROMPT).toContain('exact values')
  })
})

describe('formatChunksAsContext', () => {
  it('returns no-results message for empty array', () => {
    const result = formatChunksAsContext([])
    expect(result).toBe('No relevant reference material found.')
  })

  it('formats a single chunk with full metadata', () => {
    const chunk = buildChunk()
    const result = formatChunksAsContext([chunk])

    expect(result).toContain('--- Reference 1 ---')
    expect(result).toContain('Motorcycle: Honda CBR600RR')
    expect(result).toContain('Section: Valve Clearance Specifications')
    expect(result).toContain('Path: Engine > Valve Train > Clearance')
    expect(result).toContain('Page(s): 42, 43')
    expect(result).toContain('Type: spec_table')
    expect(result).toContain('Relevance: 92%')
    expect(result).toContain('Intake valve clearance: 0.16-0.19mm')
  })

  it('formats multiple chunks with sequential numbering', () => {
    const chunk1 = buildChunk({ id: 'chunk-1' })
    const chunk2 = buildChunk({
      id: 'chunk-2',
      content: 'Oil capacity: 3.1L',
      sectionTitle: 'Lubrication',
      similarity: 0.85,
    })

    const result = formatChunksAsContext([chunk1, chunk2])

    expect(result).toContain('--- Reference 1 ---')
    expect(result).toContain('--- Reference 2 ---')
    expect(result).toContain('Intake valve clearance')
    expect(result).toContain('Oil capacity: 3.1L')
  })

  it('handles chunk with null metadata fields', () => {
    const chunk = buildChunk({
      make: null,
      model: null,
      sectionTitle: null,
      sectionHierarchy: null,
      pageNumbers: null,
    })

    const result = formatChunksAsContext([chunk])

    expect(result).toContain('--- Reference 1 ---')
    expect(result).not.toContain('Motorcycle:')
    expect(result).not.toContain('Section:')
    expect(result).not.toContain('Path:')
    expect(result).not.toContain('Page(s):')
    expect(result).toContain('Type: spec_table')
    expect(result).toContain('Intake valve clearance')
  })

  it('handles chunk with only make (no model)', () => {
    const chunk = buildChunk({ make: 'Yamaha', model: null })
    const result = formatChunksAsContext([chunk])

    expect(result).toContain('Motorcycle: Yamaha')
  })

  it('handles chunk with empty section hierarchy', () => {
    const chunk = buildChunk({ sectionHierarchy: [] })
    const result = formatChunksAsContext([chunk])

    expect(result).not.toContain('Path:')
  })

  it('handles chunk with empty page numbers', () => {
    const chunk = buildChunk({ pageNumbers: [] })
    const result = formatChunksAsContext([chunk])

    expect(result).not.toContain('Page(s):')
  })

  it('rounds similarity to whole percent', () => {
    const chunk = buildChunk({ similarity: 0.876 })
    const result = formatChunksAsContext([chunk])

    expect(result).toContain('Relevance: 88%')
  })
})

describe('assembleRagPrompt', () => {
  it('includes user query and context', () => {
    const chunk = buildChunk()
    const result = assembleRagPrompt('What is the valve clearance?', [chunk])

    expect(result).toContain('REFERENCE MATERIAL:')
    expect(result).toContain('USER QUESTION:')
    expect(result).toContain('What is the valve clearance?')
    expect(result).toContain('Intake valve clearance')
    expect(result).toContain('Answer the question using ONLY the reference material above')
  })

  it('includes no-results message when chunks are empty', () => {
    const result = assembleRagPrompt('What is the oil capacity?', [])

    expect(result).toContain('No relevant reference material found.')
    expect(result).toContain('What is the oil capacity?')
  })

  it('includes instruction to cite sources', () => {
    const chunk = buildChunk()
    const result = assembleRagPrompt('test query', [chunk])

    expect(result).toContain('Cite sections and page numbers')
  })
})
