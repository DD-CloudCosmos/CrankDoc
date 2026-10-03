import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SafetyBadge } from './SafetyBadge'

describe('SafetyBadge', () => {
  it('renders green safety level as "Beginner-safe"', () => {
    render(<SafetyBadge level="green" />)
    expect(screen.getByText('Beginner-safe')).toBeInTheDocument()
  })

  it('renders yellow safety level as "Care required"', () => {
    render(<SafetyBadge level="yellow" />)
    expect(screen.getByText('Care required')).toBeInTheDocument()
  })

  it('renders red safety level as "Pro recommended"', () => {
    render(<SafetyBadge level="red" />)
    expect(screen.getByText('Pro recommended')).toBeInTheDocument()
  })

  it('applies safe styling for green level', () => {
    render(<SafetyBadge level="green" />)
    const badge = screen.getByText('Beginner-safe')
    expect(badge).toHaveClass('bg-safe-background', 'text-safe-foreground')
    expect(badge).toHaveAttribute('data-level', 'green')
  })

  it('applies caution styling for yellow level', () => {
    render(<SafetyBadge level="yellow" />)
    const badge = screen.getByText('Care required')
    expect(badge).toHaveClass('bg-caution-background', 'text-caution-foreground')
  })

  it('applies danger styling for red level', () => {
    render(<SafetyBadge level="red" />)
    const badge = screen.getByText('Pro recommended')
    expect(badge).toHaveClass('bg-danger-background', 'text-danger-foreground')
  })

  it('renders a decorative dot hidden from screen readers', () => {
    render(<SafetyBadge level="yellow" />)
    const dot = screen.getByText('Care required').querySelector('[aria-hidden="true"]')
    expect(dot).toHaveClass('bg-caution')
  })
})
