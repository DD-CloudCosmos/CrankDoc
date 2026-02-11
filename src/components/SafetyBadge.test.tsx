import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SafetyBadge } from './SafetyBadge'

describe('SafetyBadge', () => {
  it('renders green safety level as "Beginner Safe"', () => {
    render(<SafetyBadge level="green" />)
    expect(screen.getByText('Beginner Safe')).toBeInTheDocument()
  })

  it('renders yellow safety level as "Use Caution"', () => {
    render(<SafetyBadge level="yellow" />)
    expect(screen.getByText('Use Caution')).toBeInTheDocument()
  })

  it('renders red safety level as "Professional Recommended"', () => {
    render(<SafetyBadge level="red" />)
    expect(screen.getByText('Professional Recommended')).toBeInTheDocument()
  })

  it('applies green styling for green level', () => {
    render(<SafetyBadge level="green" />)
    const badge = screen.getByText('Beginner Safe')
    expect(badge.className).toContain('green')
  })

  it('applies yellow styling for yellow level', () => {
    render(<SafetyBadge level="yellow" />)
    const badge = screen.getByText('Use Caution')
    expect(badge.className).toContain('yellow')
  })

  it('applies red styling for red level', () => {
    render(<SafetyBadge level="red" />)
    const badge = screen.getByText('Professional Recommended')
    expect(badge.className).toContain('red')
  })
})
