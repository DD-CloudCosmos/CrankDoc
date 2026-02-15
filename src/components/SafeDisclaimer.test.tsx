import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SafeDisclaimer } from './SafeDisclaimer'

describe('SafeDisclaimer', () => {
  it('renders compact variant by default', () => {
    render(<SafeDisclaimer />)
    expect(screen.getByText(/diagnostic guidance for educational reference/i)).toBeInTheDocument()
  })

  it('renders compact variant as plain text', () => {
    render(<SafeDisclaimer variant="compact" />)
    const text = screen.getByText(/diagnostic guidance for educational reference/i)
    expect(text.tagName).toBe('P')
  })

  it('renders full variant with heading', () => {
    render(<SafeDisclaimer variant="full" />)
    expect(screen.getByText('Safety Disclaimer')).toBeInTheDocument()
  })

  it('renders full variant with disclaimer text', () => {
    render(<SafeDisclaimer variant="full" />)
    expect(screen.getByText(/diagnostic guidance for educational reference/i)).toBeInTheDocument()
    expect(screen.getByText(/consult a qualified mechanic/i)).toBeInTheDocument()
  })
})
