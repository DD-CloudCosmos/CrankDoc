import { beforeEach, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { PrivateGarage } from './PrivateGarage'
const auth = vi.hoisted(() => ({ getUser: vi.fn(), onAuthStateChange: vi.fn() }))
vi.mock('@/lib/supabase/auth-browser', () => ({ createAuthBrowserClient: () => ({ auth }) }))
let notify: (event: string, session: null | { user: { id: string } }) => void
const user = (id: string | null) => ({ data: { user: id ? { id } : null }, error: null })
beforeEach(() => {
  vi.clearAllMocks(); auth.getUser.mockResolvedValue(user('a'))
  auth.onAuthStateChange.mockImplementation(callback => { notify = callback; return { data: { subscription: { unsubscribe: vi.fn() } } } })
})
it('hides private content until verified, clears it on account change and blocks stale lookups', async () => {
  let resolve!: (value: ReturnType<typeof user>) => void
  auth.getUser.mockReturnValueOnce(new Promise(done => { resolve = done }))
  render(<PrivateGarage ownerId="a"><p>Private registration</p></PrivateGarage>)
  expect(screen.getByText('Private registration')).not.toBeVisible()
  act(() => notify('SIGNED_IN', { user: { id: 'b' } }))
  expect(screen.queryByText('Private registration')).not.toBeInTheDocument()
  await act(async () => resolve(user('a')))
  expect(screen.queryByText('Private registration')).not.toBeInTheDocument()
})
it('removes private drafts on explicit sign-out', async () => {
  render(<PrivateGarage ownerId="a"><input aria-label="Draft" defaultValue="Private" /></PrivateGarage>)
  await waitFor(() => expect(screen.getByLabelText('Draft')).toBeVisible())
  act(() => notify('SIGNED_OUT', null))
  expect(screen.queryByLabelText('Draft')).not.toBeInTheDocument()
})
it('hides back-forward snapshots before restore and checks the current account', async () => {
  render(<PrivateGarage ownerId="a"><p>Private registration</p></PrivateGarage>)
  await waitFor(() => expect(screen.getByText('Private registration')).toBeVisible())
  fireEvent(window, new Event('pagehide'))
  expect(screen.getByText('Private registration')).not.toBeVisible()
  auth.getUser.mockResolvedValue(user('b'))
  fireEvent(window, new Event('pageshow'))
  await waitFor(() => expect(screen.queryByText('Private registration')).not.toBeInTheDocument())
})
it('retains an unsaved draft invisibly on expiry and restores it only for the same owner', async () => {
  render(<PrivateGarage ownerId="a"><input aria-label="Draft" defaultValue="Keep me" /></PrivateGarage>)
  await waitFor(() => expect(screen.getByLabelText('Draft')).toBeVisible())
  auth.getUser.mockResolvedValue(user(null)); fireEvent.focus(window)
  await waitFor(() => expect(screen.getByLabelText('Draft')).not.toBeVisible())
  expect(screen.getByRole('link', { name: 'Sign in to open My Garage' })).toHaveAttribute('target', '_blank')
  auth.getUser.mockResolvedValue(user('a')); fireEvent.focus(window)
  await waitFor(() => expect(screen.getByLabelText('Draft')).toBeVisible())
  expect(screen.getByLabelText('Draft')).toHaveValue('Keep me')
})
it('does not reveal a hidden page when an earlier account lookup finishes late', async () => {
  let resolve!: (value: ReturnType<typeof user>) => void
  auth.getUser.mockReturnValueOnce(new Promise(done => { resolve = done }))
  render(<PrivateGarage ownerId="a"><p>Private registration</p></PrivateGarage>)
  fireEvent(window, new Event('pagehide'))
  await act(async () => resolve(user('a')))
  expect(screen.getByText('Private registration')).not.toBeVisible()
})
it('keeps drafts hidden when account verification cannot reach the server', async () => {
  auth.getUser.mockRejectedValue(new Error('Network unavailable'))
  render(<PrivateGarage ownerId="a"><input aria-label="Draft" defaultValue="Keep me" /></PrivateGarage>)
  expect(await screen.findByRole('link', { name: 'Sign in to open My Garage' })).toBeInTheDocument()
  expect(screen.getByLabelText('Draft')).not.toBeVisible()
})
