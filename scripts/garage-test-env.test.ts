// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest'
const { readFileSync, createClient } = vi.hoisted(() => ({ readFileSync: vi.fn(), createClient: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({ createClient }))
vi.mock('node:fs', () => ({ readFileSync }))
import { loadGarageTestEnv, createLocalTestClients } from './garage-test-env'
beforeEach(() => vi.clearAllMocks())
it.each(['http://live.supabase.co', 'http://localhost.evil.test', 'http://[::1]:54321', 'http://127.0.0.2:54321', 'https://localhost@evil.test', 'ftp://localhost', 'http://localhost/path'])('refuses non-loopback or malformed URL %s', url => {
  readFileSync.mockReturnValue(`API_URL=${url}\nANON_KEY=fake\nSERVICE_ROLE_KEY=fake`)
  expect(() => loadGarageTestEnv()).toThrow()
  expect(readFileSync).toHaveBeenCalledExactlyOnceWith('.env.garage.local')
})
it.each(['http://localhost:54321', 'http://127.0.0.1:54321'])('accepts local URL %s', url => {
  readFileSync.mockReturnValue(`API_URL="${url}"\nANON_KEY="fake-anon"\nSERVICE_ROLE_KEY="fake-service"`)
  expect(loadGarageTestEnv()).toEqual({ url, anonKey: 'fake-anon', serviceKey: 'fake-service' })
})
it('rejects missing keys', () => { readFileSync.mockReturnValue('API_URL=http://localhost:54321'); expect(() => loadGarageTestEnv()).toThrow() })
it('never falls back to another environment file', () => { readFileSync.mockImplementation(() => { throw new Error('Missing file') }); expect(() => loadGarageTestEnv()).toThrow(); expect(readFileSync).toHaveBeenCalledTimes(1) })
it('requires an API URL in its own file', () => {
  readFileSync.mockReturnValue('ANON_KEY=fake\nSERVICE_ROLE_KEY=fake')
  expect(() => loadGarageTestEnv()).toThrow('Missing local API_URL')
})
function setup() {
  readFileSync.mockReturnValue('API_URL=http://127.0.0.1:54321\nANON_KEY=fake\nSERVICE_ROLE_KEY=fake-service')
  const createUser = vi.fn().mockResolvedValueOnce({ data: { user: { id: 'a' } }, error: null }).mockResolvedValueOnce({ data: { user: { id: 'b' } }, error: null })
  const deleteUser = vi.fn().mockResolvedValue({ error: null })
  const insert = vi.fn().mockResolvedValue({ error: null })
  const eq = vi.fn().mockResolvedValue({ error: null })
  const table = { insert, delete: vi.fn().mockReturnValue({ eq }) }
  const admin = { auth: { admin: { createUser, deleteUser } }, from: vi.fn().mockReturnValue(table) }
  const signedIn = () => ({ auth: { signInWithPassword: vi.fn().mockResolvedValue({ error: null }), signOut: vi.fn().mockResolvedValue({ error: null }) } })
  const a = signedIn(), b = signedIn()
  createClient.mockReset().mockReturnValueOnce(admin).mockReturnValueOnce(a).mockReturnValueOnce(b)
  return { admin, a, b, createUser, deleteUser, insert, eq }
}
it('creates isolated signed-in clients and cleans up its users and model', async () => {
  const mock = setup()
  const result = await createLocalTestClients()
  expect(result.userA).toBe('a')
  expect(result.userB).toBe('b')
  expect(mock.a.auth.signInWithPassword).toHaveBeenCalledOnce()
  expect(mock.b.auth.signInWithPassword).toHaveBeenCalledOnce()
  expect(mock.createUser).toHaveBeenCalledWith(expect.objectContaining({ email_confirm: true }))
  expect(mock.insert).toHaveBeenCalledWith(expect.objectContaining({ id: result.modelId, year_start: 2023, year_end: 2023 }))
  await result.cleanup()
  expect(mock.a.auth.signOut).toHaveBeenCalledOnce()
  expect(mock.b.auth.signOut).toHaveBeenCalledOnce()
  expect(mock.deleteUser.mock.calls).toEqual([['a'], ['b']])
  expect(mock.eq).toHaveBeenCalledWith('id', result.modelId)
})
it.each(['user', 'signin', 'model'])('cleans up a partially failed %s setup', async stage => {
  const mock = setup()
  const error = new Error('Setup failed')
  if (stage === 'user') mock.createUser.mockReset().mockResolvedValueOnce({ data: { user: { id: 'a' } }, error: null }).mockResolvedValueOnce({ data: { user: null }, error })
  if (stage === 'signin') mock.b.auth.signInWithPassword.mockResolvedValueOnce({ error })
  if (stage === 'model') mock.insert.mockResolvedValueOnce({ error })
  await expect(createLocalTestClients()).rejects.toThrow('Setup failed')
  expect(mock.deleteUser).toHaveBeenCalledWith('a')
  if (stage !== 'user') expect(mock.deleteUser).toHaveBeenCalledWith('b')
  expect(mock.eq).toHaveBeenCalledOnce()
})
it('fails safely before creating clients for a hosted URL', async () => {
  setup()
  readFileSync.mockReturnValue('API_URL=https://live.supabase.co\nANON_KEY=fake\nSERVICE_ROLE_KEY=fake')
  await expect(createLocalTestClients()).rejects.toThrow('loopback')
  expect(createClient).not.toHaveBeenCalled()
})
