import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CB1000RReference } from './CB1000RReference'
import { cb1000rServiceIntervals, cb1000rSpecSections } from '@/lib/cb1000r'

describe('CB1000R reference', () => {
  it('starts with Engine open and preserves every specification', () => {
    const { container } = render(<CB1000RReference />)
    expect(screen.getByText('Engine').closest('details')).toHaveAttribute('open')
    expect(screen.getByText('Transmission').closest('details')).not.toHaveAttribute('open')
    for (const section of cb1000rSpecSections) for (const row of section.rows) {
      expect(screen.getByText(row.label)).toBeInTheDocument()
      for (const part of row.value.split(row.label === 'Gear ratios, 1st to 6th' ? ' / ' : '; ')) expect(container.textContent).toContain(part)
    }
    expect(container.textContent).toContain('2.538')
    expect(container.textContent).toContain('1.115')
  })
  it('searches measurement conditions, opens matches and recovers after clearing', () => {
    render(<CB1000RReference />)
    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'sidestand' } })
    expect(screen.getByText('Chain slack')).toBeInTheDocument()
    expect(screen.getByText('Transmission').closest('details')).toHaveAttribute('open')
    expect(screen.queryByText('Displacement')).not.toBeInTheDocument()
    fireEvent.change(input, { target: { value: 'no such specification' } })
    expect(screen.getByRole('status')).toHaveTextContent('No specifications')
    fireEvent.change(input, { target: { value: '' } })
    expect(screen.getByText('Displacement')).toBeInTheDocument()
    expect(screen.getByText('Transmission').closest('details')).not.toHaveAttribute('open')
  })
  it('shows all services once and switches to the manual’s miles without converting', () => {
    render(<CB1000RReference intervals={cb1000rServiceIntervals} />)
    for (const item of cb1000rServiceIntervals) expect(screen.getAllByText(item.service_name)).toHaveLength(1)
    expect(screen.getByText('At 1,000 km')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Miles' }))
    expect(screen.getByText('At 600 miles')).toBeInTheDocument()
    expect(screen.getAllByText('Every 8,000 miles or 12 months').length).toBeGreaterThan(0)
  })
  it('finds service details and retains fluids, torques and one-off timing', () => {
    render(<CB1000RReference intervals={cb1000rServiceIntervals} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'oil and filter replacement' } })
    const item = cb1000rServiceIntervals.find(item => item.service_name === 'Engine oil and filter replacement')!
    expect(screen.getByText(item.service_name).closest('details')).toHaveAttribute('open')
    expect(screen.getByText(item.description!)).toBeInTheDocument()
    expect(screen.getByText(item.fluid_spec!)).toBeInTheDocument()
    expect(screen.getByText(item.torque_spec!)).toBeInTheDocument()
    expect(screen.queryByText('First service (one-off)')).not.toBeInTheDocument()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'unfindable' } })
    expect(screen.getByRole('status')).toHaveTextContent('No services')
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'mechanical qualifications' } })
    expect(screen.getByText('Schedule notes').closest('details')).toHaveAttribute('open')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
