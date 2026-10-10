import { expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AccountPage from './page'
const { getAccount } = vi.hoisted(() => ({ getAccount: vi.fn() }))
vi.mock('@/lib/account', async (importOriginal) => ({ ...await importOriginal<typeof import('@/lib/account')>(), getAccount }))
vi.mock('./AccountForm', () => ({ AccountForm: (props: { signedIn: boolean; next: string; invalidLink: boolean }) => <div>{props.signedIn ? 'Signed in' : 'Sign in'} {props.next} {props.invalidLink ? 'Invalid link' : ''}</div> }))
it('passes verified account state and a safe destination to the form', async () => {
  getAccount.mockResolvedValue({ userId: 'owner' })
  render(await AccountPage({ searchParams: Promise.resolve({ next: '//evil.test', error: 'invalid-link' }) }))
  expect(screen.getByText(/Signed in \/garage Invalid link/)).toBeVisible()
})
