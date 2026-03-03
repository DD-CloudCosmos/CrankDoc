import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CoverageIndicator } from './CoverageIndicator'

describe('CoverageIndicator', () => {
  it('renders "Ingested" label for ingested status', () => {
    render(<CoverageIndicator status="ingested" />)
    expect(screen.getByText('Ingested')).toBeInTheDocument()
  })

  it('renders "Uploaded" label for local_only status', () => {
    render(<CoverageIndicator status="local_only" />)
    expect(screen.getByText('Uploaded')).toBeInTheDocument()
  })

  it('renders "Missing" label for missing status', () => {
    render(<CoverageIndicator status="missing" />)
    expect(screen.getByText('Missing')).toBeInTheDocument()
  })

  it('applies green dot class for ingested status', () => {
    const { container } = render(<CoverageIndicator status="ingested" />)
    const dot = container.querySelector('[aria-hidden="true"]')
    expect(dot?.className).toContain('bg-green-500')
  })

  it('applies amber dot class for local_only status', () => {
    const { container } = render(<CoverageIndicator status="local_only" />)
    const dot = container.querySelector('[aria-hidden="true"]')
    expect(dot?.className).toContain('bg-amber-500')
  })

  it('applies gray dot class for missing status', () => {
    const { container } = render(<CoverageIndicator status="missing" />)
    const dot = container.querySelector('[aria-hidden="true"]')
    expect(dot?.className).toContain('bg-gray-300')
  })

  it('applies custom className', () => {
    const { container } = render(
      <CoverageIndicator status="ingested" className="mt-4" />
    )
    const wrapper = container.firstElementChild
    expect(wrapper?.className).toContain('mt-4')
  })
})
