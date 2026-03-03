import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DiagnoseStepIndicator } from './DiagnoseStepIndicator'

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

describe('DiagnoseStepIndicator', () => {
  it('renders 3 step labels: Select, Symptom, Fix', () => {
    render(<DiagnoseStepIndicator currentStep={1} />)
    expect(screen.getByText('Select')).toBeInTheDocument()
    expect(screen.getByText('Symptom')).toBeInTheDocument()
    expect(screen.getByText('Fix')).toBeInTheDocument()
  })

  it('shows active styling on step 1 when currentStep is 1', () => {
    render(<DiagnoseStepIndicator currentStep={1} />)
    // Step 1 is active — should show the number "1" (not a check icon)
    expect(screen.getByText('1')).toBeInTheDocument()
    // Steps 2 and 3 are future — should show their numbers
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    // No links should be present (no completed steps)
    expect(screen.queryAllByRole('link')).toHaveLength(0)
  })

  it('shows step 1 as completed with link when currentStep is 2', () => {
    render(<DiagnoseStepIndicator currentStep={2} />)
    // Step 1 is completed — should be a link
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAttribute('href', '/diagnose')
    // Step 2 is active — should show "2"
    expect(screen.getByText('2')).toBeInTheDocument()
    // Step 3 is future — should show "3"
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows steps 1 and 2 as completed with links when currentStep is 3', () => {
    render(<DiagnoseStepIndicator currentStep={3} bikeId="bike-123" />)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(2)
    // Step 1 links to /diagnose
    expect(links[0]).toHaveAttribute('href', '/diagnose')
    // Step 2 links to /diagnose?bike=bike-123
    expect(links[1]).toHaveAttribute('href', '/diagnose?bike=bike-123')
    // Step 3 is active — should show "3"
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('does not render step 2 as a link when bikeId is not provided', () => {
    render(<DiagnoseStepIndicator currentStep={3} />)
    // Step 1 is a link, but step 2 is not (no bikeId)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAttribute('href', '/diagnose')
  })

  it('renders completed steps with check icons (no step numbers)', () => {
    render(<DiagnoseStepIndicator currentStep={3} bikeId="bike-456" />)
    // Steps 1 and 2 are completed — should NOT show "1" or "2" as text
    expect(screen.queryByText('1')).not.toBeInTheDocument()
    expect(screen.queryByText('2')).not.toBeInTheDocument()
    // Step 3 is active — should show "3"
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})
