import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateEmbedding, generateBatchEmbeddings, createOpenAIClient } from './embeddings'
import { EMBEDDING_DIMENSIONS } from './rag.types'

// Mock the openai module
vi.mock('openai', () => {
  const MockOpenAI = vi.fn()
  return { default: MockOpenAI }
})

/**
 * Helper: creates a fake embedding vector of the expected dimension.
 */
function fakeEmbedding(seed = 0): number[] {
  return Array.from({ length: EMBEDDING_DIMENSIONS }, (_, i) => (i + seed) * 0.001)
}

/**
 * Helper: builds a mock OpenAI client with a configurable embeddings.create method.
 */
function buildMockClient(createFn: ReturnType<typeof vi.fn>) {
  return {
    embeddings: {
      create: createFn,
    },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}

describe('createOpenAIClient', () => {
  const originalEnv = process.env.OPENAI_API_KEY

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.OPENAI_API_KEY = originalEnv
    } else {
      delete process.env.OPENAI_API_KEY
    }
  })

  it('throws if OPENAI_API_KEY is not set', () => {
    delete process.env.OPENAI_API_KEY

    expect(() => createOpenAIClient()).toThrow('Missing OPENAI_API_KEY')
  })

  it('creates a client when OPENAI_API_KEY is set', () => {
    process.env.OPENAI_API_KEY = 'sk-test-key'

    const client = createOpenAIClient()
    expect(client).toBeDefined()
  })
})

describe('generateEmbedding', () => {
  let mockCreate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockCreate = vi.fn()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns embedding and token count on success', async () => {
    const embedding = fakeEmbedding()
    mockCreate.mockResolvedValueOnce({
      data: [{ embedding, index: 0 }],
      usage: { total_tokens: 10 },
    })

    const client = buildMockClient(mockCreate)
    const result = await generateEmbedding('test text', client)

    expect(result.embedding).toEqual(embedding)
    expect(result.tokenCount).toBe(10)
    expect(mockCreate).toHaveBeenCalledTimes(1)
    expect(mockCreate).toHaveBeenCalledWith({
      model: 'text-embedding-3-small',
      input: 'test text',
      dimensions: EMBEDDING_DIMENSIONS,
    })
  })

  it('retries on failure and succeeds on second attempt', async () => {
    const embedding = fakeEmbedding()

    mockCreate.mockRejectedValueOnce(new Error('API rate limit'))
    mockCreate.mockResolvedValueOnce({
      data: [{ embedding, index: 0 }],
      usage: { total_tokens: 10 },
    })

    const client = buildMockClient(mockCreate)
    const promise = generateEmbedding('test text', client)

    // Advance past first backoff (500ms)
    await vi.advanceTimersByTimeAsync(600)

    const result = await promise

    expect(result.embedding).toEqual(embedding)
    expect(mockCreate).toHaveBeenCalledTimes(2)
  })

  it('throws after all retries exhausted', async () => {
    mockCreate.mockRejectedValue(new Error('API down'))

    const client = buildMockClient(mockCreate)
    const promise = generateEmbedding('test text', client)

    // Attach rejection handler BEFORE advancing timers to avoid unhandled rejection
    const expectation = expect(promise).rejects.toThrow('Failed to generate embedding after 3 attempts')

    await vi.advanceTimersByTimeAsync(600)
    await vi.advanceTimersByTimeAsync(1100)
    await vi.advanceTimersByTimeAsync(2100)

    await expectation
    expect(mockCreate).toHaveBeenCalledTimes(3)
  })

  it('includes the original error message when throwing', async () => {
    mockCreate.mockRejectedValue(new Error('Invalid API key'))

    const client = buildMockClient(mockCreate)
    const promise = generateEmbedding('test text', client)

    // Attach rejection handler BEFORE advancing timers to avoid unhandled rejection
    const expectation = expect(promise).rejects.toThrow('Invalid API key')

    await vi.advanceTimersByTimeAsync(600)
    await vi.advanceTimersByTimeAsync(1100)
    await vi.advanceTimersByTimeAsync(2100)

    await expectation
  })
})

describe('generateBatchEmbeddings', () => {
  let mockCreate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockCreate = vi.fn()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns empty result for empty input', async () => {
    const client = buildMockClient(mockCreate)
    const result = await generateBatchEmbeddings([], client)

    expect(result.embeddings).toEqual([])
    expect(result.totalTokens).toBe(0)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('generates embeddings for multiple texts in one call', async () => {
    const emb1 = fakeEmbedding(1)
    const emb2 = fakeEmbedding(2)

    mockCreate.mockResolvedValueOnce({
      data: [
        { embedding: emb1, index: 0 },
        { embedding: emb2, index: 1 },
      ],
      usage: { total_tokens: 20 },
    })

    const client = buildMockClient(mockCreate)
    const result = await generateBatchEmbeddings(['text one', 'text two'], client)

    expect(result.embeddings).toHaveLength(2)
    expect(result.embeddings[0]).toEqual(emb1)
    expect(result.embeddings[1]).toEqual(emb2)
    expect(result.totalTokens).toBe(20)
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('sorts embeddings by index regardless of API return order', async () => {
    const emb1 = fakeEmbedding(1)
    const emb2 = fakeEmbedding(2)

    // API returns them out of order
    mockCreate.mockResolvedValueOnce({
      data: [
        { embedding: emb2, index: 1 },
        { embedding: emb1, index: 0 },
      ],
      usage: { total_tokens: 20 },
    })

    const client = buildMockClient(mockCreate)
    const result = await generateBatchEmbeddings(['text one', 'text two'], client)

    expect(result.embeddings[0]).toEqual(emb1)
    expect(result.embeddings[1]).toEqual(emb2)
  })

  it('retries a failed batch and succeeds', async () => {
    const emb1 = fakeEmbedding(1)

    mockCreate.mockRejectedValueOnce(new Error('Rate limit'))
    mockCreate.mockResolvedValueOnce({
      data: [{ embedding: emb1, index: 0 }],
      usage: { total_tokens: 5 },
    })

    const client = buildMockClient(mockCreate)
    const promise = generateBatchEmbeddings(['text one'], client)

    await vi.advanceTimersByTimeAsync(600)

    const result = await promise

    expect(result.embeddings).toHaveLength(1)
    expect(mockCreate).toHaveBeenCalledTimes(2)
  })

  it('throws after all retries exhausted for a batch', async () => {
    mockCreate.mockRejectedValue(new Error('Service unavailable'))

    const client = buildMockClient(mockCreate)
    const promise = generateBatchEmbeddings(['text one'], client)

    // Attach rejection handler BEFORE advancing timers to avoid unhandled rejection
    const expectation = expect(promise).rejects.toThrow('Failed to generate batch embeddings after 3 attempts')

    await vi.advanceTimersByTimeAsync(600)
    await vi.advanceTimersByTimeAsync(1100)
    await vi.advanceTimersByTimeAsync(2100)

    await expectation
  })
})
