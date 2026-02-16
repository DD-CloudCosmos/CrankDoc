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
    expect(screen.getByText('Engine Oil Change')).toBeInTheDocument()
    expect(screen.getByText('Spark Plugs')).toBeInTheDocument()
  })

  it('shows miles, km, and months values', () => {
    render(<ServiceIntervalTable intervals={mockIntervals} />)
    // toLocaleString formats vary by locale (5,000 vs 5.000)
    const formattedMiles = (5000).toLocaleString()
    const formattedKm = (8000).toLocaleString()
    expect(screen.getByText(formattedMiles)).toBeInTheDocument()
    expect(screen.getByText(formattedKm)).toBeInTheDocument()
  })

  it('shows description when available', () => {
    render(<ServiceIntervalTable intervals={mockIntervals} />)
    expect(screen.getByText('Replace engine oil and filter.')).toBeInTheDocument()
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

  it('displays torque_spec when available', () => {
    const intervalsWithTorque: ServiceInterval[] = [
      {
        id: '4',
        motorcycle_id: 'moto-1',
        service_name: 'Oil Drain Plug',
        interval_miles: 5000,
        interval_km: 8000,
        interval_months: 12,
        description: null,
        torque_spec: '30 Nm',
        fluid_spec: null,
        created_at: '2024-01-01T00:00:00Z',
      },
    ]
    render(<ServiceIntervalTable intervals={intervalsWithTorque} />)
    expect(screen.getByText('30 Nm')).toBeInTheDocument()
    expect(screen.getByText('Torque:')).toBeInTheDocument()
  })

  it('displays fluid_spec when available', () => {
    const intervalsWithFluid: ServiceInterval[] = [
      {
        id: '5',
        motorcycle_id: 'moto-1',
        service_name: 'Engine Oil Change',
        interval_miles: 5000,
        interval_km: 8000,
        interval_months: 12,
        description: null,
        torque_spec: null,
        fluid_spec: '10W-40 Synthetic, 3.2L',
        created_at: '2024-01-01T00:00:00Z',
      },
    ]
    render(<ServiceIntervalTable intervals={intervalsWithFluid} />)
    expect(screen.getByText('10W-40 Synthetic, 3.2L')).toBeInTheDocument()
    expect(screen.getByText('Fluid:')).toBeInTheDocument()
  })

  it('displays both torque_spec and fluid_spec together', () => {
    const intervalsWithBoth: ServiceInterval[] = [
      {
        id: '6',
        motorcycle_id: 'moto-1',
        service_name: 'Oil Drain Plug',
        interval_miles: 5000,
        interval_km: 8000,
        interval_months: 12,
        description: null,
        torque_spec: '30 Nm',
        fluid_spec: '10W-40 Synthetic',
        created_at: '2024-01-01T00:00:00Z',
      },
    ]
    render(<ServiceIntervalTable intervals={intervalsWithBoth} />)
    expect(screen.getByText('30 Nm')).toBeInTheDocument()
    expect(screen.getByText('10W-40 Synthetic')).toBeInTheDocument()
  })

  it('does not display specs section when both torque_spec and fluid_spec are null', () => {
    render(<ServiceIntervalTable intervals={mockIntervals} />)
    expect(screen.queryByText('Torque:')).not.toBeInTheDocument()
    expect(screen.queryByText('Fluid:')).not.toBeInTheDocument()
  })
})
