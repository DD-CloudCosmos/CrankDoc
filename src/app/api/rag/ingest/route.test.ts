import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}))

import { createServerClient } from '@/lib/supabase/server'

function buildMockSupabase(options: {
  selectData?: unknown[]
  selectError?: { message: string } | null
  selectCount?: number
  insertData?: unknown
  insertError?: { message: string } | null
}) {
  const rangeFn = vi.fn(() => ({
    data: options.selectData ?? [],
    error: options.selectError ?? null,
    count: options.selectCount ?? 0,
  }))

  const orderFn = vi.fn(() => ({
    range: rangeFn,
  }))

  const singleFn = vi.fn(() => ({
    data: options.insertData ?? null,
    error: options.insertError ?? null,
  }))

  const insertSelectFn = vi.fn(() => ({
    single: singleFn,
  }))

  const insertFn = vi.fn(() => ({
    select: insertSelectFn,
  }))

  const eqFn = vi.fn(() => ({
    range: rangeFn,
  }))

  const selectFn = vi.fn(() => ({
    order: orderFn,
    eq: eqFn,
    range: rangeFn,
  }))

  return {
    from: vi.fn(() => ({
      select: selectFn,
      insert: insertFn,
    })),
    _selectFn: selectFn,
    _insertFn: insertFn,
    _orderFn: orderFn,
    _eqFn: eqFn,
    _rangeFn: rangeFn,
  }
}

function buildGetRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/rag/ingest')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return new Request(url.toString())
}

function buildPostRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/rag/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('GET /api/rag/ingest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns document sources with default pagination', async () => {
    const mockDocs = [
      { id: 'doc-1', title: 'Honda CBR600RR Manual', processing_status: 'completed' },
    ]
    vi.mocked(createServerClient).mockReturnValue(
      buildMockSupabase({ selectData: mockDocs, selectCount: 1 }) as never
    )

    const { GET } = await import('./route')
    const response = await GET(buildGetRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.documents).toHaveLength(1)
    expect(data.documents[0].title).toBe('Honda CBR600RR Manual')
    expect(data.total).toBe(1)
    expect(data.limit).toBe(20)
    expect(data.offset).toBe(0)
  })

  it('returns empty list when no documents exist', async () => {
    vi.mocked(createServerClient).mockReturnValue(
      buildMockSupabase({ selectData: [], selectCount: 0 }) as never
    )

    const { GET } = await import('./route')
    const response = await GET(buildGetRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.documents).toEqual([])
    expect(data.total).toBe(0)
  })

  it('returns 500 when database query fails', async () => {
    vi.mocked(createServerClient).mockReturnValue(
      buildMockSupabase({ selectError: { message: 'DB error' } }) as never
    )

    const { GET } = await import('./route')
    const response = await GET(buildGetRequest())
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('DB error')
  })
})

describe('POST /api/rag/ingest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a manual entry document source', async () => {
    const insertedDoc = {
      id: 'new-doc-1',
      title: 'Quick Reference',
      processing_status: 'pending',
      created_at: '2024-01-01T00:00:00Z',
    }
    vi.mocked(createServerClient).mockReturnValue(
      buildMockSupabase({ insertData: insertedDoc }) as never
    )

    const { POST } = await import('./route')
    const response = await POST(
      buildPostRequest({ title: 'Quick Reference', content: 'Some content' })
    )
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.document.id).toBe('new-doc-1')
    expect(data.document.title).toBe('Quick Reference')
  })

  it('returns 400 for missing title', async () => {
    const { POST } = await import('./route')
    const response = await POST(buildPostRequest({ content: 'Some content' }))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('title')
  })

  it('returns 400 for empty title', async () => {
    const { POST } = await import('./route')
    const response = await POST(buildPostRequest({ title: '   ', content: 'Some content' }))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('title')
  })

  it('returns 400 for missing content', async () => {
    const { POST } = await import('./route')
    const response = await POST(buildPostRequest({ title: 'Test' }))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('content')
  })

  it('returns 400 for empty content', async () => {
    const { POST } = await import('./route')
    const response = await POST(buildPostRequest({ title: 'Test', content: '' }))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('content')
  })

  it('returns 400 for invalid JSON', async () => {
    const { POST } = await import('./route')
    const response = await POST(
      new Request('http://localhost/api/rag/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json',
      })
    )
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Invalid JSON')
  })

  it('returns 500 when insert fails', async () => {
    vi.mocked(createServerClient).mockReturnValue(
      buildMockSupabase({ insertError: { message: 'Insert failed' } }) as never
    )

    const { POST } = await import('./route')
    const response = await POST(
      buildPostRequest({ title: 'Test', content: 'Content' })
    )
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Insert failed')
  })
})
