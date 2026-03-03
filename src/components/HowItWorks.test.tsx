import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HowItWorks } from './HowItWorks'

describe('HowItWorks', () => {
  it('renders the section heading', () => {
    render(<HowItWorks />)
    expect(screen.getByText('How It Works')).toBeInTheDocument()
  })

  it('renders all three steps', () => {
    render(<HowItWorks />)
    expect(screen.getByText('Select Your Motorcycle')).toBeInTheDocument()
    expect(screen.getByText('Choose Your Symptom')).toBeInTheDocument()
    expect(screen.getByText('Follow the Steps')).toBeInTheDocument()
  })

  it('renders step numbers', () => {
    render(<HowItWorks />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders step descriptions', () => {
    render(<HowItWorks />)
    expect(screen.getByText(/choose from honda, yamaha/i)).toBeInTheDocument()
    expect(screen.getByText(/pick the issue you are experiencing/i)).toBeInTheDocument()
    expect(screen.getByText(/walk through guided questions/i)).toBeInTheDocument()
  })

  it('renders the CTA button linking to /diagnose', () => {
    render(<HowItWorks />)
    const cta = screen.getByRole('link', { name: /start diagnosing/i })
    expect(cta).toHaveAttribute('href', '/diagnose')
  })

  it('renders the helper text', () => {
    render(<HowItWorks />)
    expect(screen.getByText(/no account needed/i)).toBeInTheDocument()
  })
})
