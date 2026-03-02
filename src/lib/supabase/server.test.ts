import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// vi.hoisted runs before vi.mock hoisting, making the variable available in the factory
const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn().mockReturnValue({ from: vi.fn() }),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}))

import { createServerClient, createServiceClient } from './server'

describe('createServerClient', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    mockCreateClient.mockClear()
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('creates a client with correct URL and anon key', () => {
    createServerClient()

    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      expect.objectContaining({
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    )
  })

  it('throws when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL

    expect(() => createServerClient()).toThrow(
      'Missing Supabase environment variables'
    )
  })

  it('throws when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    expect(() => createServerClient()).toThrow(
      'Missing Supabase environment variables'
    )
  })

  it('throws when both env vars are missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    expect(() => createServerClient()).toThrow(
      'Missing Supabase environment variables'
    )
  })
})

describe('createServiceClient', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    mockCreateClient.mockClear()
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('creates a client with correct URL and service role key', () => {
    createServiceClient()

    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-service-role-key',
      expect.objectContaining({
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    )
  })

  it('throws when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL

    expect(() => createServiceClient()).toThrow(
      'Missing Supabase environment variables'
    )
  })

  it('throws when SUPABASE_SERVICE_ROLE_KEY is missing', () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY

    expect(() => createServiceClient()).toThrow(
      'Missing Supabase environment variables'
    )
  })

  it('throws when both env vars are missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY

    expect(() => createServiceClient()).toThrow(
      'Missing Supabase environment variables'
    )
  })

  it('does not use anon key for service client', () => {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

    createServiceClient()

    // Second argument should be the service role key, not the anon key
    expect(mockCreateClient).toHaveBeenCalledWith(
      expect.any(String),
      'test-service-role-key',
      expect.any(Object)
    )
  })
})
