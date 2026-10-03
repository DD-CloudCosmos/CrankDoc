import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ErrorPage from './error'

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

describe('ErrorPage', () => {
  let consoleError: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => consoleError.mockRestore())

  it('explains the failure and logs the error', () => {
    const error = new Error('db down')
    render(<ErrorPage error={error} reset={() => {}} />)
    expect(screen.getByRole('heading', { level: 1, name: /this page couldn't load/i })).toBeInTheDocument()
    expect(consoleError).toHaveBeenCalledWith(error)
  })

  it('retries with reset', async () => {
    const user = userEvent.setup()
    const reset = vi.fn()
    render(<ErrorPage error={new Error('x')} reset={reset} />)
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(reset).toHaveBeenCalledOnce()
  })

  it('links home and shows the error reference when available', () => {
    const error = Object.assign(new Error('x'), { digest: 'abc123' })
    render(<ErrorPage error={error} reset={() => {}} />)
    expect(screen.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', '/')
    expect(screen.getByText('Error reference abc123')).toBeInTheDocument()
  })
})
