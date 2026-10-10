import { expect, it, vi } from 'vitest'
import { createAuthBrowserClient } from './auth-browser'
const { createBrowserClient } = vi.hoisted(() => ({ createBrowserClient: vi.fn() }))
vi.mock('@supabase/ssr', () => ({ createBrowserClient }))
it('uses only public credentials and cookie-based browser storage', () => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://fake.supabase.test')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'fake-public-key')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'never-use-this')
  createBrowserClient.mockReturnValue({ browser: true })
  expect(createAuthBrowserClient()).toEqual({ browser: true })
  expect(createBrowserClient).toHaveBeenCalledWith('https://fake.supabase.test', 'fake-public-key')
})
