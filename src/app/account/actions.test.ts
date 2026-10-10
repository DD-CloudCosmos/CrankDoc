import { beforeEach, expect, it, vi } from 'vitest'
import { signUp, signIn, sendRecovery, setPassword, signOut } from './actions'
const { auth, getAccount } = vi.hoisted(() => ({ auth: { signUp: vi.fn(), signInWithPassword: vi.fn(), resetPasswordForEmail: vi.fn(), updateUser: vi.fn(), signOut: vi.fn() }, getAccount: vi.fn() }))
vi.mock('@/lib/supabase/auth-server', () => ({ createAuthServerClient: async () => ({ auth }) }))
vi.mock('@/lib/account', () => ({ getAccount }))
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000'); Object.values(auth).forEach((method) => method.mockResolvedValue({ error: null })); getAccount.mockResolvedValue({ client: { auth }, userId: 'owner' }) })
it('uses the configured origin for confirmation, with no service role client', async () => {
  expect(await signUp('owner@example.test', 'password123')).toEqual({ ok: true })
  expect(auth.signUp).toHaveBeenCalledWith({ email: 'owner@example.test', password: 'password123', options: { emailRedirectTo: 'http://localhost:3000/auth/callback?next=/garage' } })
})
it('rejects passwords shorter than eight characters before contacting Auth', async () => {
  expect((await signUp('owner@example.test', 'short')).ok).toBe(false)
  expect((await setPassword('short')).ok).toBe(false)
  expect(auth.signUp).not.toHaveBeenCalled()
  expect(auth.updateUser).not.toHaveBeenCalled()
})
it('reports wrong password without exposing provider details', async () => {
  auth.signInWithPassword.mockResolvedValue({ error: { message: 'internal secrets' } })
  expect(await signIn('owner@example.test', 'wrong-password')).toEqual({ ok: false, message: 'Could not sign in. Check your email and password, and confirm your email first.' })
})
it('uses the same recovery result for existing and unknown email addresses', async () => {
  expect(await sendRecovery('known@example.test')).toEqual({ ok: true })
  expect(await sendRecovery('unknown@example.test')).toEqual({ ok: true })
  expect(auth.resetPasswordForEmail).toHaveBeenLastCalledWith('unknown@example.test', { redirectTo: 'http://localhost:3000/auth/callback?next=/account/reset-password' })
})
it('reports a failed recovery without exposing whether an email exists', async () => {
  auth.resetPasswordForEmail.mockResolvedValue({ error: { message: 'provider error' } })
  expect(await sendRecovery('owner@example.test')).toEqual({ ok: false, message: 'Could not send a recovery link. Please try again.' })
})
it('rejects a password save after session expiry', async () => {
  getAccount.mockResolvedValue(null)
  expect(await setPassword('password123')).toEqual({ ok: false, message: 'Your session expired. Request a new recovery link and try again.' })
  expect(auth.updateUser).not.toHaveBeenCalled()
})
it('changes the verified account password and signs out with the cookie client', async () => {
  expect(await setPassword('password123')).toEqual({ ok: true })
  expect(auth.updateUser).toHaveBeenCalledWith({ password: 'password123' })
  expect(await signOut()).toEqual({ ok: true })
  expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' })
})
it('reports provider update and sign-out failures honestly', async () => {
  auth.updateUser.mockResolvedValue({ error: {} }); auth.signOut.mockResolvedValue({ error: {} })
  expect((await setPassword('password123')).ok).toBe(false)
  expect((await signOut()).ok).toBe(false)
})
