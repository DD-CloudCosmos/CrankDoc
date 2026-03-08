import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('POST /api/admin/login', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it('returns 400 when password is missing', async () => {
    vi.stubEnv('ADMIN_PASSWORD', 'secret123')
    vi.stubEnv('ADMIN_SESSION_SECRET', 'session-token')

    const { POST } = await import('./route')
    const request = new Request('http://localhost/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toBe('Password is required')
  })

  it('returns 401 when password is incorrect', async () => {
    vi.stubEnv('ADMIN_PASSWORD', 'correct-password')
    vi.stubEnv('ADMIN_SESSION_SECRET', 'session-token')

    const { POST } = await import('./route')
    const request = new Request('http://localhost/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrong-password' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)

    const data = await response.json()
    expect(data.error).toBe('Invalid password')
  })

  it('returns 200 and sets cookie on correct password', async () => {
    vi.stubEnv('ADMIN_PASSWORD', 'correct-password')
    vi.stubEnv('ADMIN_SESSION_SECRET', 'my-session-secret')

    const { POST } = await import('./route')
    const request = new Request('http://localhost/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'correct-password' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)

    const setCookie = response.headers.get('set-cookie')
    expect(setCookie).toContain('admin-token=my-session-secret')
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie?.toLowerCase()).toContain('samesite=lax')
    expect(setCookie).toContain('Path=/')
  })

  it('returns 500 when ADMIN_PASSWORD is not set', async () => {
    vi.stubEnv('ADMIN_PASSWORD', '')
    vi.stubEnv('ADMIN_SESSION_SECRET', 'session-token')

    const { POST } = await import('./route')
    const request = new Request('http://localhost/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'anything' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(500)

    const data = await response.json()
    expect(data.error).toBe('Server configuration error')
  })

  it('returns 500 when ADMIN_SESSION_SECRET is not set', async () => {
    vi.stubEnv('ADMIN_PASSWORD', 'correct-password')
    vi.stubEnv('ADMIN_SESSION_SECRET', '')

    const { POST } = await import('./route')
    const request = new Request('http://localhost/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'correct-password' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(500)

    const data = await response.json()
    expect(data.error).toBe('Server configuration error')
  })

  it('returns 400 on invalid JSON body', async () => {
    vi.stubEnv('ADMIN_PASSWORD', 'secret123')
    vi.stubEnv('ADMIN_SESSION_SECRET', 'session-token')

    const { POST } = await import('./route')
    const request = new Request('http://localhost/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toBe('Invalid request body')
  })
})
