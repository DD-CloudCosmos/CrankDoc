import { beforeEach, expect, it, vi } from 'vitest'
import { createAuthServerClient } from './auth-server'
const { createServerClient, cookieStore } = vi.hoisted(() => ({ createServerClient: vi.fn(), cookieStore: { getAll: vi.fn(), set: vi.fn() } }))
vi.mock('@supabase/ssr', () => ({ createServerClient }))
vi.mock('next/headers', () => ({ cookies: async () => cookieStore }))
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://fake.supabase.test')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'fake-public-key')
})
it('reads and writes all cookie chunks using only public credentials', async () => {
  cookieStore.getAll.mockReturnValue([{ name: 'session.0', value: 'first' }])
  createServerClient.mockReturnValue({ auth: true })
  expect(await createAuthServerClient()).toEqual({ auth: true })
  expect(createServerClient.mock.calls[0].slice(0, 2)).toEqual(['https://fake.supabase.test', 'fake-public-key'])
  const adapter = createServerClient.mock.calls[0][2].cookies
  expect(adapter.getAll()).toEqual([{ name: 'session.0', value: 'first' }])
  adapter.setAll([{ name: 'session.0', value: 'fresh', options: { sameSite: 'lax' } }])
  expect(cookieStore.set).toHaveBeenCalledWith('session.0', 'fresh', { sameSite: 'lax' })
})
it('allows read-only Server Components; refresh writes belong to the proxy', async () => {
  cookieStore.set.mockImplementation(() => { throw new Error('read only') })
  await createAuthServerClient()
  expect(() => createServerClient.mock.calls[0][2].cookies.setAll([{ name: 'session', value: 'fresh', options: {} }])).not.toThrow()
})
