import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from './page'

describe('Home page', () => {
  it('renders the hero section with title', () => {
    render(<Home />)
    expect(screen.getByText('CrankDoc')).toBeInTheDocument()
  })

  it('renders the tagline', () => {
    render(<Home />)
    expect(
      screen.getByText(/your motorcycle mechanic's digital companion/i)
    ).toBeInTheDocument()
  })

  it('renders the CTA button linking to /diagnose', () => {
    render(<Home />)
    const cta = screen.getByRole('link', { name: /start diagnosing/i })
    expect(cta).toHaveAttribute('href', '/diagnose')
  })

  it('renders the How It Works section', () => {
    render(<Home />)
    expect(screen.getByText('How It Works')).toBeInTheDocument()
  })
})
