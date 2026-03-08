import { describe, it, expect } from 'vitest'
import { POST } from './route'

describe('POST /api/admin/logout', () => {
  it('returns 200 and clears the admin-token cookie', async () => {
    const response = await POST()
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)

    const setCookie = response.headers.get('set-cookie')
    expect(setCookie).toContain('admin-token=')
    expect(setCookie).toContain('Max-Age=0')
  })
})
