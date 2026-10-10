import { beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { updateAccountSession } from './auth-proxy'
const { getUser, createServerClient } = vi.hoisted(() => ({ getUser: vi.fn(), createServerClient: vi.fn() }))
vi.mock('@supabase/ssr', () => ({ createServerClient }))
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://fake.supabase.test')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'fake-key')
  createServerClient.mockReturnValue({ auth: { getUser } })
})
it('allows signed-in private requests and forbids caching', async () => {
  getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null })
  const response = await updateAccountSession(new NextRequest('https://example.test/garage'))
  expect(response.status).toBe(200)
  expect(response.headers.get('cache-control')).toBe('private, no-store')
})
it('redirects signed-out garage navigation to sign-in with a local return path', async () => {
  getUser.mockResolvedValue({ data: { user: null }, error: null })
  const response = await updateAccountSession(new NextRequest('https://example.test/garage/123?tab=maintenance'))
  const target = new URL(response.headers.get('location')!)
  expect(target.pathname).toBe('/account')
  expect(target.searchParams.get('next')).toBe('/garage/123?tab=maintenance')
  expect(response.headers.get('cache-control')).toBe('private, no-store')
})
it('returns an uncached 401 for signed-out private API calls', async () => {
  getUser.mockResolvedValue({ data: { user: null }, error: new Error('expired') })
  const response = await updateAccountSession(new NextRequest('https://example.test/api/garage/bikes'))
  expect(response.status).toBe(401)
  expect(response.headers.get('cache-control')).toBe('private, no-store')
})
it('preserves refreshed cookies and provider cache headers when redirecting', async () => {
  const request = new NextRequest('https://example.test/garage')
  getUser.mockImplementation(async () => {
    const adapter = createServerClient.mock.calls[0][2].cookies
    adapter.setAll([{ name: 'session', value: 'fresh', options: { httpOnly: true } }], { 'Cache-Control': 'private, no-store', Expires: '0', Pragma: 'no-cache' })
    return { data: { user: null }, error: null }
  })
  const response = await updateAccountSession(request)
  expect(request.cookies.get('session')?.value).toBe('fresh')
  expect(response.cookies.get('session')?.value).toBe('fresh')
  expect(response.headers.get('expires')).toBe('0')
  expect(response.headers.get('pragma')).toBe('no-cache')
})
it('does not redirect account or callback pages', async () => {
  getUser.mockResolvedValue({ data: { user: null }, error: null })
  for (const path of ['/account', '/account/reset-password', '/auth/callback']) {
    expect((await updateAccountSession(new NextRequest(`https://example.test${path}`))).status).toBe(200)
  }
})
