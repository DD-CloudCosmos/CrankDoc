import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Logo } from './Logo'

describe('Logo', () => {
  it('renders the CrankDoc text', () => {
    render(<Logo />)
    expect(screen.getByText('CrankDoc')).toBeInTheDocument()
  })

  it('renders as an h1 element', () => {
    render(<Logo />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('CrankDoc')
  })

  it('applies default classes', () => {
    render(<Logo />)
    const heading = screen.getByText('CrankDoc')
    expect(heading).toHaveClass('text-2xl', 'font-bold')
  })

  it('merges custom className with default classes', () => {
    render(<Logo className="custom-class" />)
    const heading = screen.getByText('CrankDoc')
    expect(heading).toHaveClass('text-2xl', 'font-bold', 'custom-class')
  })
})
