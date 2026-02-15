import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ServiceIntervalTable } from './ServiceIntervalTable'
import type { ServiceInterval } from '@/types/database.types'

const mockIntervals: ServiceInterval[] = [
  {
    id: '1',
    motorcycle_id: 'moto-1',
    service_name: 'Engine Oil Change',
    interval_miles: 5000,
    interval_km: 8000,
    interval_months: 12,
    description: 'Replace engine oil and filter.',
    torque_spec: null,
    fluid_spec: null,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    motorcycle_id: 'moto-1',
    service_name: 'Spark Plugs',
    interval_miles: 20000,
    interval_km: 32000,
    interval_months: null,
    description: null,
    torque_spec: null,
    fluid_spec: null,
    created_at: '2024-01-01T00:00:00Z',
  },
]

describe('ServiceIntervalTable', () => {
  it('renders all interval entries', () => {
    render(<ServiceIntervalTable intervals={mockIntervals} />)
    expect(screen.getAllByText('Engine Oil Change')).toHaveLength(2) // table + card view
    expect(screen.getAllByText('Spark Plugs')).toHaveLength(2)
  })

  it('shows miles, km, and months values', () => {
    render(<ServiceIntervalTable intervals={mockIntervals} />)
    // toLocaleString formats vary by locale (5,000 vs 5.000)
    const formattedMiles = (5000).toLocaleString()
    const formattedKm = (8000).toLocaleString()
    expect(screen.getAllByText(formattedMiles).length).toBeGreaterThan(0)
    expect(screen.getAllByText(formattedKm).length).toBeGreaterThan(0)
  })

  it('shows description when available', () => {
    render(<ServiceIntervalTable intervals={mockIntervals} />)
    expect(screen.getAllByText('Replace engine oil and filter.').length).toBeGreaterThan(0)
  })

  it('shows empty state when no intervals', () => {
    render(<ServiceIntervalTable intervals={[]} />)
    expect(screen.getByText(/no service intervals available/i)).toBeInTheDocument()
  })

  it('shows dash for null interval values in table view', () => {
    const intervalWithNulls: ServiceInterval[] = [
      {
        id: '3',
        motorcycle_id: 'moto-1',
        service_name: 'Brake Fluid',
        interval_miles: null,
        interval_km: null,
        interval_months: 24,
        description: null,
        torque_spec: null,
        fluid_spec: null,
        created_at: '2024-01-01T00:00:00Z',
      },
    ]
    render(<ServiceIntervalTable intervals={intervalWithNulls} />)
    // The dash character should appear for null miles and km values
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })
})
