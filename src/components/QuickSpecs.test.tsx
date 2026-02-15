import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QuickSpecs } from './QuickSpecs'
import type { Motorcycle } from '@/types/database.types'

const fullMotorcycle: Motorcycle = {
  id: 'moto-1',
  make: 'Honda',
  model: 'CBR600RR',
  year_start: 2007,
  year_end: 2012,
  engine_type: 'Inline-4',
  displacement_cc: 599,
  category: 'sport',
  image_url: null,
  generation: '3rd Gen',
  fuel_system: 'EFI',
  dry_weight_kg: 155,
  horsepower: 118,
  torque_nm: 66,
  fuel_capacity_liters: 18,
  oil_capacity_liters: 3.4,
  coolant_capacity_liters: 2.2,
  valve_clearance_intake: '0.16-0.19mm',
  valve_clearance_exhaust: '0.22-0.25mm',
  spark_plug: 'IMR9C-9HES',
  tire_front: '120/70ZR17',
  tire_rear: '180/55ZR17',
  created_at: '2024-01-01T00:00:00Z',
}

const minimalMotorcycle: Motorcycle = {
  id: 'moto-2',
  make: 'Generic',
  model: 'Bike',
  year_start: 2020,
  year_end: null,
  engine_type: null,
  displacement_cc: null,
  category: null,
  image_url: null,
  generation: null,
  fuel_system: null,
  dry_weight_kg: null,
  horsepower: null,
  torque_nm: null,
  fuel_capacity_liters: null,
  oil_capacity_liters: null,
  coolant_capacity_liters: null,
  valve_clearance_intake: null,
  valve_clearance_exhaust: null,
  spark_plug: null,
  tire_front: null,
  tire_rear: null,
  created_at: '2024-01-01T00:00:00Z',
}

describe('QuickSpecs', () => {
  it('renders badges for non-null spec values', () => {
    render(<QuickSpecs motorcycle={fullMotorcycle} />)
    expect(screen.getByText('599cc')).toBeInTheDocument()
    expect(screen.getByText('118 hp')).toBeInTheDocument()
    expect(screen.getByText('155 kg')).toBeInTheDocument()
    expect(screen.getByText('3.4L')).toBeInTheDocument()
  })

  it('returns null when no spec values are available', () => {
    const { container } = render(<QuickSpecs motorcycle={minimalMotorcycle} />)
    expect(container.innerHTML).toBe('')
  })

  it('skips null values and only renders available badges', () => {
    const partialMotorcycle: Motorcycle = {
      ...minimalMotorcycle,
      displacement_cc: 1200,
      horsepower: 136,
    }
    render(<QuickSpecs motorcycle={partialMotorcycle} />)
    expect(screen.getByText('1200cc')).toBeInTheDocument()
    expect(screen.getByText('136 hp')).toBeInTheDocument()
    expect(screen.queryByText(/kg/)).not.toBeInTheDocument()
    expect(screen.queryByText(/L$/)).not.toBeInTheDocument()
  })

  it('renders the quick-specs container with correct test id', () => {
    render(<QuickSpecs motorcycle={fullMotorcycle} />)
    expect(screen.getByTestId('quick-specs')).toBeInTheDocument()
  })
})
