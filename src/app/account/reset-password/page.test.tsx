import { expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ResetPasswordPage from './page'
const { getAccount } = vi.hoisted(() => ({ getAccount: vi.fn() }))
vi.mock('@/lib/account', () => ({ getAccount }))
vi.mock('../AccountForm', () => ({ AccountForm: () => <div>Password form</div> }))
it('shows a recovery action instead of a password form without a verified session', async () => {
  getAccount.mockResolvedValue(null)
  render(await ResetPasswordPage())
  expect(screen.getByRole('link', { name: 'Request a new recovery link' })).toHaveAttribute('href', '/account?error=invalid-link')
  expect(screen.queryByText('Password form')).not.toBeInTheDocument()
})
it('allows a verified account to choose a password', async () => {
  getAccount.mockResolvedValue({ userId: 'owner' })
  render(await ResetPasswordPage())
  expect(screen.getByText('Password form')).toBeVisible()
})
