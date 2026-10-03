import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Logo, AppIcon } from './Logo'

describe('Logo', () => {
  it('renders the CrankDoc wordmark', () => {
    render(<Logo />)
    expect(screen.getByText('CrankDoc')).toBeInTheDocument()
  })

  it('is not a heading, so pages keep their own h1', () => {
    render(<Logo />)
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('includes a decorative app icon', () => {
    const { container } = render(<Logo />)
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })

  it('merges custom className', () => {
    render(<Logo className="custom-class" />)
    expect(screen.getByText('CrankDoc')).toHaveClass('font-semibold', 'custom-class')
  })
})

describe('AppIcon', () => {
  it('is hidden from screen readers and accepts a size class', () => {
    const { container } = render(<AppIcon className="h-20 w-20" />)
    const icon = container.firstChild as HTMLElement
    expect(icon).toHaveAttribute('aria-hidden', 'true')
    expect(icon).toHaveClass('h-20', 'w-20')
  })
})
