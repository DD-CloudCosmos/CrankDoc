import { expect, it, vi, beforeEach } from 'vitest'
import { getAccount, safeReturnPath } from './account'
const { getUser, client } = vi.hoisted(() => { const getUser = vi.fn(); return { getUser, client: { auth: { getUser } } } })
vi.mock('@/lib/supabase/auth-server', () => ({ createAuthServerClient: vi.fn(async () => client) }))
beforeEach(() => vi.clearAllMocks())
it('rejects external return destinations', () => {
  for (const path of ['https://other.example/garage', '//other.example/garage', '/\\other.example', '/%5cother.example', '/garage\nLocation: evil']) expect(safeReturnPath(path)).toBe('/garage')
  expect(safeReturnPath('/garage/123?tab=maintenance')).toBe('/garage/123?tab=maintenance')
  expect(safeReturnPath(null)).toBe('/garage')
})
it('returns a verified stable account identifier', async () => {
  getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null })
  expect(await getAccount()).toEqual({ client, userId: 'owner-1' })
})
it('rejects invalid and expired sessions', async () => {
  getUser.mockResolvedValue({ data: { user: { id: 'untrusted' } }, error: new Error('expired') })
  expect(await getAccount()).toBeNull()
  getUser.mockResolvedValue({ data: { user: null }, error: null })
  expect(await getAccount()).toBeNull()
})
