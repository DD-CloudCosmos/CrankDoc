import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BackButton } from './BackButton'

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

describe('BackButton', () => {
  it('renders with the correct label', () => {
    render(<BackButton href="/bikes" label="Back to all bikes" />)
    expect(screen.getByText('Back to all bikes')).toBeInTheDocument()
  })

  it('links to the correct href', () => {
    render(<BackButton href="/diagnose" label="Back to symptoms" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/diagnose')
  })

  it('renders the ArrowLeft icon', () => {
    const { container } = render(<BackButton href="/bikes" label="Back" />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('h-4', 'w-4')
  })
})
