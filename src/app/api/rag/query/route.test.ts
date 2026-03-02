import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock all external dependencies before imports
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}))

vi.mock('@/lib/rag/embeddings', () => ({
  generateEmbedding: vi.fn(),
}))

vi.mock('@/lib/rag/vectorSearch', () => ({
  searchDocumentChunks: vi.fn(),
}))

vi.mock('@/lib/rag/prompts', () => ({
  CRANKDOC_RAG_SYSTEM_PROMPT:
    'You are CrankDoc, a motorcycle diagnostic assistant.',
  assembleRagPrompt: vi.fn(
    (query: string) => `Assembled prompt for: ${query}`
  ),
}))

vi.mock('ai', () => ({
  streamText: vi.fn(),
}))

vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: vi.fn((model: string) => `anthropic-${model}`),
}))

import { createServerClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/rag/embeddings'
import { searchDocumentChunks } from '@/lib/rag/vectorSearch'
import { assembleRagPrompt } from '@/lib/rag/prompts'
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

/** Helper to build a POST request with the given body */
function buildPostRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/rag/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}


/** Sample embedding result */
const MOCK_EMBEDDING_RESULT = {
  embedding: [0.1, 0.2, 0.3],
  tokenCount: 5,
}

/** Sample search results */
const MOCK_SEARCH_RESULTS = [
  {
    id: 'chunk-1',
    content: 'Oil capacity is 3.5 liters.',
    sectionTitle: 'Engine Specifications',
    sectionHierarchy: ['Maintenance', 'Engine', 'Specifications'],
    pageNumbers: [42],
    contentType: 'service_manual',
    make: 'Honda',
    model: 'CBR600RR',
    similarity: 0.92,
  },
  {
    id: 'chunk-2',
    content: 'Use 10W-40 synthetic oil.',
    sectionTitle: 'Lubrication',
    sectionHierarchy: ['Maintenance', 'Lubrication'],
    pageNumbers: [43],
    contentType: 'service_manual',
    make: 'Honda',
    model: 'CBR600RR',
    similarity: 0.87,
  },
]

/** Mock streamed response object */
function buildMockStreamResult() {
  return {
    toTextStreamResponse: vi.fn(
      () => new Response('streamed data', { status: 200 })
    ),
  }
}

describe('POST /api/rag/query', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 for missing query field', async () => {
    const { POST } = await import('./route')
    const request = buildPostRequest({ make: 'Honda' })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Missing required field: query')
  })

  it('returns 400 for empty query string', async () => {
    const { POST } = await import('./route')
    const request = buildPostRequest({ query: '' })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Query must be a non-empty string')
  })

  it('returns 400 for whitespace-only query string', async () => {
    const { POST } = await import('./route')
    const request = buildPostRequest({ query: '   ' })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Query must be a non-empty string')
  })

  it('returns 400 for maxResults greater than 20', async () => {
    const { POST } = await import('./route')
    const request = buildPostRequest({ query: 'oil capacity', maxResults: 25 })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('maxResults must be between 1 and 20')
  })

  it('returns 400 for maxResults less than 1', async () => {
    const { POST } = await import('./route')
    const request = buildPostRequest({ query: 'oil capacity', maxResults: 0 })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('maxResults must be between 1 and 20')
  })

  it('returns 400 for non-integer maxResults', async () => {
    const { POST } = await import('./route')
    const request = buildPostRequest({ query: 'oil capacity', maxResults: 3.5 })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('maxResults must be an integer between 1 and 20')
  })

  it('returns 400 for invalid JSON body', async () => {
    const { POST } = await import('./route')
    const request = new Request('http://localhost/api/rag/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not valid json',
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Invalid JSON in request body')
  })

  it('returns no results JSON when no chunks are found', async () => {
    vi.mocked(generateEmbedding).mockResolvedValue(MOCK_EMBEDDING_RESULT)
    vi.mocked(createServerClient).mockReturnValue({} as never)
    vi.mocked(searchDocumentChunks).mockResolvedValue([])

    const { POST } = await import('./route')
    const request = buildPostRequest({ query: 'obscure part nobody has' })
    const response = await POST(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.answer).toContain("don't have any relevant reference materials")
    expect(data.sources).toEqual([])
  })

  it('calls generateEmbedding with the query text', async () => {
    vi.mocked(generateEmbedding).mockResolvedValue(MOCK_EMBEDDING_RESULT)
    vi.mocked(createServerClient).mockReturnValue({} as never)
    vi.mocked(searchDocumentChunks).mockResolvedValue(MOCK_SEARCH_RESULTS)
    vi.mocked(streamText).mockReturnValue(buildMockStreamResult() as never)

    const { POST } = await import('./route')
    const request = buildPostRequest({ query: 'What is the oil capacity?' })
    await POST(request)

    expect(generateEmbedding).toHaveBeenCalledWith('What is the oil capacity?')
  })

  it('calls searchDocumentChunks with correct filters', async () => {
    vi.mocked(generateEmbedding).mockResolvedValue(MOCK_EMBEDDING_RESULT)
    vi.mocked(createServerClient).mockReturnValue({} as never)
    vi.mocked(searchDocumentChunks).mockResolvedValue(MOCK_SEARCH_RESULTS)
    vi.mocked(streamText).mockReturnValue(buildMockStreamResult() as never)

    const { POST } = await import('./route')
    const request = buildPostRequest({
      query: 'oil capacity',
      motorcycleId: 'uuid-123',
      make: 'Honda',
      model: 'CBR600RR',
      contentType: 'service_manual',
      maxResults: 10,
    })
    await POST(request)

    expect(searchDocumentChunks).toHaveBeenCalledWith(
      expect.anything(),
      {
        queryEmbedding: MOCK_EMBEDDING_RESULT.embedding,
        matchCount: 10,
        filters: {
          motorcycleId: 'uuid-123',
          make: 'Honda',
          model: 'CBR600RR',
          contentType: 'service_manual',
        },
      }
    )
  })

  it('calls searchDocumentChunks with default maxResults of 5', async () => {
    vi.mocked(generateEmbedding).mockResolvedValue(MOCK_EMBEDDING_RESULT)
    vi.mocked(createServerClient).mockReturnValue({} as never)
    vi.mocked(searchDocumentChunks).mockResolvedValue(MOCK_SEARCH_RESULTS)
    vi.mocked(streamText).mockReturnValue(buildMockStreamResult() as never)

    const { POST } = await import('./route')
    const request = buildPostRequest({ query: 'oil capacity' })
    await POST(request)

    expect(searchDocumentChunks).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ matchCount: 5 })
    )
  })

  it('returns streamed response on success with correct streamText params', async () => {
    vi.mocked(generateEmbedding).mockResolvedValue(MOCK_EMBEDDING_RESULT)
    vi.mocked(createServerClient).mockReturnValue({} as never)
    vi.mocked(searchDocumentChunks).mockResolvedValue(MOCK_SEARCH_RESULTS)
    const mockResult = buildMockStreamResult()
    vi.mocked(streamText).mockReturnValue(mockResult as never)

    const { POST } = await import('./route')
    const request = buildPostRequest({ query: 'What is the oil capacity?' })
    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(streamText).toHaveBeenCalledWith({
      model: anthropic('claude-sonnet-4-20250514'),
      system: 'You are CrankDoc, a motorcycle diagnostic assistant.',
      prompt: assembleRagPrompt('What is the oil capacity?', MOCK_SEARCH_RESULTS),
      maxOutputTokens: 2000,
    })
    expect(mockResult.toTextStreamResponse).toHaveBeenCalled()
  })

  it('returns 500 when embedding generation fails', async () => {
    vi.mocked(generateEmbedding).mockRejectedValue(
      new Error('OpenAI API error')
    )

    const { POST } = await import('./route')
    const request = buildPostRequest({ query: 'oil capacity' })
    const response = await POST(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Failed to generate query embedding')
  })

  it('returns 500 when vector search fails', async () => {
    vi.mocked(generateEmbedding).mockResolvedValue(MOCK_EMBEDDING_RESULT)
    vi.mocked(createServerClient).mockReturnValue({} as never)
    vi.mocked(searchDocumentChunks).mockRejectedValue(
      new Error('Vector search failed: DB error')
    )

    const { POST } = await import('./route')
    const request = buildPostRequest({ query: 'oil capacity' })
    const response = await POST(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Failed to search document chunks')
  })

  it('omits empty filters from search params', async () => {
    vi.mocked(generateEmbedding).mockResolvedValue(MOCK_EMBEDDING_RESULT)
    vi.mocked(createServerClient).mockReturnValue({} as never)
    vi.mocked(searchDocumentChunks).mockResolvedValue(MOCK_SEARCH_RESULTS)
    vi.mocked(streamText).mockReturnValue(buildMockStreamResult() as never)

    const { POST } = await import('./route')
    const request = buildPostRequest({ query: 'oil capacity', make: 'Honda' })
    await POST(request)

    expect(searchDocumentChunks).toHaveBeenCalledWith(
      expect.anything(),
      {
        queryEmbedding: MOCK_EMBEDDING_RESULT.embedding,
        matchCount: 5,
        filters: {
          make: 'Honda',
        },
      }
    )
  })

  it('returns 400 for non-string optional fields', async () => {
    const { POST } = await import('./route')
    const request = buildPostRequest({ query: 'oil capacity', make: 123 })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('make must be a string')
  })
})

describe('GET /api/rag/query', () => {
  it('returns 405 for GET method (only POST is exported)', async () => {
    const routeModule = await import('./route')

    // In Next.js App Router, only exported HTTP methods are handled.
    // If GET is not exported, Next.js returns 405 automatically.
    expect(routeModule).not.toHaveProperty('GET')
    expect(routeModule).toHaveProperty('POST')
  })
})
