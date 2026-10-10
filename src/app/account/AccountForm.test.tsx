import { beforeEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AccountForm } from './AccountForm'
const { signIn, signUp, sendRecovery, setPassword, signOut } = vi.hoisted(() => ({ signIn: vi.fn(), signUp: vi.fn(), sendRecovery: vi.fn(), setPassword: vi.fn(), signOut: vi.fn() }))
vi.mock('./actions', () => ({ signIn, signUp, sendRecovery, setPassword, signOut }))
beforeEach(() => { cleanup(); vi.clearAllMocks() })
async function fill(email = true) {
  const user = userEvent.setup()
  if (email) await user.type(screen.getByLabelText('Email'), 'owner@example.test')
  await user.type(screen.getByLabelText('Password'), 'password123')
  return user
}
it('retains useful values after a wrong password', async () => {
  signIn.mockResolvedValue({ ok: false, message: 'Check your email and password.' })
  render(<AccountForm />)
  const user = await fill()
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Check your email and password.')
  expect(screen.getByLabelText('Email')).toHaveValue('owner@example.test')
  expect(screen.getByLabelText('Password')).toHaveValue('password123')
})
it('shows confirmation pending without claiming the account is signed in', async () => {
  signUp.mockResolvedValue({ ok: true })
  render(<AccountForm />)
  const user = await fill()
  await user.click(screen.getByRole('button', { name: 'Create account' }))
  expect(await screen.findByRole('status')).toHaveTextContent('Check your email to confirm your account, then sign in.')
})
it('reports failed recovery and keeps the email', async () => {
  sendRecovery.mockResolvedValue({ ok: false, message: 'Could not send a recovery link. Please try again.' })
  render(<AccountForm />)
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Email'), 'owner@example.test')
  await user.click(screen.getByRole('button', { name: 'Send recovery link' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not send a recovery link.')
  expect(screen.getByLabelText('Email')).toHaveValue('owner@example.test')
})
it('offers a new link when an expired link reaches the account page', () => {
  render(<AccountForm invalidLink />)
  expect(screen.getByRole('alert')).toHaveTextContent('This link is invalid or expired. Request a new recovery link below.')
  expect(screen.getByRole('button', { name: 'Send recovery link' })).toBeVisible()
})
it('preserves the password visibly when the session expires while saving', async () => {
  setPassword.mockResolvedValue({ ok: false, message: 'Your session expired. Request a new recovery link and try again.' })
  render(<AccountForm resetPassword />)
  const user = await fill(false)
  await user.click(screen.getByRole('button', { name: 'Save password' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Your session expired.')
  expect(screen.getByLabelText('Password')).toHaveValue('password123')
  expect(screen.queryByText('Password saved.')).not.toBeInTheDocument()
})
it('removes the signed-in account view after logout before a second account signs in', async () => {
  signOut.mockResolvedValue({ ok: true })
  signIn.mockResolvedValue({ ok: true })
  render(<AccountForm signedIn />)
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Sign out' }))
  await waitFor(() => expect(screen.queryByText('You are signed in.')).not.toBeInTheDocument())
  expect(screen.getByLabelText('Email')).toHaveValue('')
  expect(screen.getByLabelText('Password')).toHaveValue('')
  await user.type(screen.getByLabelText('Email'), 'second@example.test')
  await user.type(screen.getByLabelText('Password'), 'second-password')
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
  await waitFor(() => expect(signIn).toHaveBeenCalledWith('second@example.test', 'second-password'))
  expect(screen.queryByText('You are signed in.')).not.toBeInTheDocument()
})
