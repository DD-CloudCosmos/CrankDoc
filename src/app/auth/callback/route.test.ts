import { beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'
const { exchangeCodeForSession } = vi.hoisted(() => ({ exchangeCodeForSession: vi.fn() }))
vi.mock('@/lib/supabase/auth-server', () => ({ createAuthServerClient: async () => ({ auth: { exchangeCodeForSession } }) }))
beforeEach(() => { vi.clearAllMocks(); exchangeCodeForSession.mockResolvedValue({ error: null }); vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000') })
it('exchanges only the code then redirects to the safe local destination', async () => {
  const response = await GET(new NextRequest('http://untrusted.test/auth/callback?code=one-time&next=/account/reset-password'))
  expect(exchangeCodeForSession).toHaveBeenCalledWith('one-time')
  expect(response.headers.get('location')).toBe('http://localhost:3000/account/reset-password')
  expect(response.headers.get('cache-control')).toBe('private, no-store')
})
it('rejects an external return destination', async () => {
  const response = await GET(new NextRequest('http://localhost:3000/auth/callback?code=test&next=https://evil.test'))
  expect(response.headers.get('location')).toBe('http://localhost:3000/garage')
})
it('returns an actionable account page for missing and expired codes', async () => {
  exchangeCodeForSession.mockResolvedValue({ error: { message: 'expired secret' } })
  for (const query of ['', '?code=expired']) {
    const response = await GET(new NextRequest(`http://localhost:3000/auth/callback${query}`))
    expect(response.headers.get('location')).toBe('http://localhost:3000/account?error=invalid-link')
  }
  expect(exchangeCodeForSession).toHaveBeenCalledTimes(1)
})
