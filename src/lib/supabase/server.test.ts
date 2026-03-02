import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @supabase/supabase-js before importing the module under test
const mockCreateClient = vi.fn().mockReturnValue({ from: vi.fn() })
vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}))

describe('createServerClient', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    mockCreateClient.mockClear()
  })

  it('creates a client with anon key when env vars are set', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')

    const { createServerClient } = await import('./server')
    createServerClient()

    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )
  })

  it('throws when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')

    const { createServerClient } = await import('./server')
    expect(() => createServerClient()).toThrow('Missing Supabase environment variables')
  })

  it('throws when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')

    const { createServerClient } = await import('./server')
    expect(() => createServerClient()).toThrow('Missing Supabase environment variables')
  })
})

describe('createServiceClient', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    mockCreateClient.mockClear()
  })

  it('creates a client with service role key when env vars are set', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key')

    const { createServiceClient } = await import('./server')
    createServiceClient()

    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-service-role-key',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )
  })

  it('throws when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key')

    const { createServiceClient } = await import('./server')
    expect(() => createServiceClient()).toThrow('Missing Supabase environment variables')
  })

  it('throws when SUPABASE_SERVICE_ROLE_KEY is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')

    const { createServiceClient } = await import('./server')
    expect(() => createServiceClient()).toThrow('Missing Supabase environment variables')
  })

  it('configures auth with no session persistence', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key')

    const { createServiceClient } = await import('./server')
    createServiceClient()

    const callArgs = mockCreateClient.mock.calls[0]
    expect(callArgs[2].auth.persistSession).toBe(false)
    expect(callArgs[2].auth.autoRefreshToken).toBe(false)
  })
})
