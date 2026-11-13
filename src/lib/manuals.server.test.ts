import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchDocumentSources, fetchMotorcycles, listStorageManuals } from './manuals.server'

const mockCreateServerClient = vi.fn()
const mockCreateServiceClient = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => mockCreateServerClient(),
  createServiceClient: () => mockCreateServiceClient(),
}))

/** A Supabase client whose document_sources query and bucket listing resolve to the given results. */
function clientReturning(result: { data: unknown; error: unknown }) {
  const order = vi.fn()
  order.mockReturnValueOnce({ order }).mockResolvedValueOnce(result)
  return {
    from: vi.fn(() => ({ select: vi.fn(() => Object.assign(Promise.resolve(result), { order })) })),
    storage: { from: vi.fn(() => ({ list: vi.fn().mockResolvedValue(result) })) },
  }
}

describe('manuals.server', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('reads document sources with the service client, because the table is private', async () => {
    mockCreateServiceClient.mockReturnValue(clientReturning({ data: [{ id: 'ds-1' }], error: null }))
    await expect(fetchDocumentSources()).resolves.toEqual([{ id: 'ds-1' }])
    expect(mockCreateServiceClient).toHaveBeenCalledOnce()
    expect(mockCreateServerClient).not.toHaveBeenCalled()
  })

  it('throws when document sources cannot be read', async () => {
    mockCreateServiceClient.mockReturnValue(clientReturning({ data: null, error: { message: 'denied' } }))
    await expect(fetchDocumentSources()).rejects.toThrow('Failed to fetch document sources')
  })

  it('lists the private manuals bucket with the service client and keeps parseable PDFs only', async () => {
    mockCreateServiceClient.mockReturnValue(
      clientReturning({
        data: [{ name: 'honda-cbr600rr-service-2003.pdf' }, { name: 'notes.txt' }, { name: 'unparseable.pdf' }],
        error: null,
      })
    )
    const files = await listStorageManuals()
    expect(files?.map((file) => file.filename)).toEqual(['honda-cbr600rr-service-2003.pdf'])
    expect(mockCreateServerClient).not.toHaveBeenCalled()
  })

  it('returns null instead of throwing when the service role key is missing', async () => {
    mockCreateServiceClient.mockImplementation(() => {
      throw new Error('Missing Supabase environment variables')
    })
    await expect(listStorageManuals()).resolves.toBeNull()
  })

  it('still reads the public motorcycles table with the anon client', async () => {
    mockCreateServerClient.mockReturnValue(clientReturning({ data: [{ id: 'bike-1' }], error: null }))
    await expect(fetchMotorcycles()).resolves.toEqual([{ id: 'bike-1' }])
    expect(mockCreateServiceClient).not.toHaveBeenCalled()
  })
})
