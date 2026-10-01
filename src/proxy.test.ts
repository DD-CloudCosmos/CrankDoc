import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from './middleware'

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

describe('Admin auth middleware', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  it('redirects unauthenticated requests to /admin/login', () => {
    vi.stubEnv('ADMIN_SESSION_SECRET', 'test-secret')

    const request = createRequest('/admin')
    const response = middleware(request)

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toContain('/admin/login')
    expect(location).toContain('from=%2Fadmin')
  })

  it('redirects unauthenticated requests to /admin/manuals to login', () => {
    vi.stubEnv('ADMIN_SESSION_SECRET', 'test-secret')

    const request = createRequest('/admin/manuals')
    const response = middleware(request)

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toContain('/admin/login')
    expect(location).toContain('from=%2Fadmin%2Fmanuals')
  })

  it('allows authenticated requests through', () => {
    vi.stubEnv('ADMIN_SESSION_SECRET', 'test-secret')

    const request = createRequest('/admin', { 'admin-token': 'test-secret' })
    const response = middleware(request)

    expect(response.status).toBe(200)
  })

  it('does not redirect the login page itself', () => {
    vi.stubEnv('ADMIN_SESSION_SECRET', 'test-secret')

    const request = createRequest('/admin/login')
    const response = middleware(request)

    expect(response.status).toBe(200)
  })

  it('redirects when token does not match', () => {
    vi.stubEnv('ADMIN_SESSION_SECRET', 'test-secret')

    const request = createRequest('/admin', { 'admin-token': 'wrong-token' })
    const response = middleware(request)

    expect(response.status).toBe(307)
  })

  it('redirects when ADMIN_SESSION_SECRET is not set', () => {
    vi.stubEnv('ADMIN_SESSION_SECRET', '')

    const request = createRequest('/admin', { 'admin-token': 'any-token' })
    const response = middleware(request)

    expect(response.status).toBe(307)
  })
})
