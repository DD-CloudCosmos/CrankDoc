import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { proxy } from './proxy'
const { updateAccountSession } = vi.hoisted(() => ({ updateAccountSession: vi.fn() }))
vi.mock('@/lib/supabase/auth-proxy', () => ({ updateAccountSession }))

function createRequest(path: string, cookies?: Record<string, string>): NextRequest {
  const url = `http://localhost${path}`
  const request = new NextRequest(url)

  if (cookies) {
    for (const [name, value] of Object.entries(cookies)) {
      request.cookies.set(name, value)
    }
  }

  return request
}

describe('Admin auth proxy', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  it('redirects unauthenticated requests to /admin/login', async () => {
    vi.stubEnv('ADMIN_SESSION_SECRET', 'test-secret')

    const request = createRequest('/admin')
    const response = await proxy(request)

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toContain('/admin/login')
    expect(location).toContain('from=%2Fadmin')
  })

  it('redirects unauthenticated requests to /admin/manuals to login', async () => {
    vi.stubEnv('ADMIN_SESSION_SECRET', 'test-secret')

    const request = createRequest('/admin/manuals')
    const response = await proxy(request)

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toContain('/admin/login')
    expect(location).toContain('from=%2Fadmin%2Fmanuals')
  })

  it('allows authenticated requests through', async () => {
    vi.stubEnv('ADMIN_SESSION_SECRET', 'test-secret')

    const request = createRequest('/admin', { 'admin-token': 'test-secret' })
    const response = await proxy(request)

    expect(response.status).toBe(200)
  })

  it('does not redirect the login page itself', async () => {
    vi.stubEnv('ADMIN_SESSION_SECRET', 'test-secret')

    const request = createRequest('/admin/login')
    const response = await proxy(request)

    expect(response.status).toBe(200)
  })

  it('redirects when token does not match', async () => {
    vi.stubEnv('ADMIN_SESSION_SECRET', 'test-secret')

    const request = createRequest('/admin', { 'admin-token': 'wrong-token' })
    const response = await proxy(request)

    expect(response.status).toBe(307)
  })

  it('redirects when ADMIN_SESSION_SECRET is not set', async () => {
    vi.stubEnv('ADMIN_SESSION_SECRET', '')

    const request = createRequest('/admin', { 'admin-token': 'any-token' })
    const response = await proxy(request)

    expect(response.status).toBe(307)
  })
})

it('uses personal session protection only for private paths', async () => {
  const response = NextResponse.next()
  response.headers.set('cache-control', 'private, no-store')
  updateAccountSession.mockResolvedValue(response)
  for (const path of ['/garage', '/account', '/auth/callback', '/api/garage/bikes']) {
    expect(await proxy(createRequest(path))).toBe(response)
  }
  expect(updateAccountSession).toHaveBeenCalledTimes(4)
  expect((await proxy(createRequest('/bikes'))).status).toBe(200)
  expect(updateAccountSession).toHaveBeenCalledTimes(4)
})
