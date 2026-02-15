import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SpecSheet } from './SpecSheet'
import type { Motorcycle } from '@/types/database.types'

const fullMotorcycle: Motorcycle = {
  id: 'moto-1',
  make: 'Honda',
  model: 'CBR600RR',
  year_start: 2007,
  year_end: 2012,
  engine_type: 'inline-4',
  displacement_cc: 599,
  category: 'sport',
  image_url: null,
  generation: 'PC40',
  fuel_system: 'PGM-FI',
  dry_weight_kg: 155,
  horsepower: 118,
  torque_nm: 66,
  fuel_capacity_liters: 18,
  oil_capacity_liters: 3.4,
  coolant_capacity_liters: 2.2,
  valve_clearance_intake: '0.16-0.20mm',
  valve_clearance_exhaust: '0.22-0.27mm',
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

describe('SpecSheet', () => {
  it('renders all spec sections for a full motorcycle', () => {
    render(<SpecSheet motorcycle={fullMotorcycle} />)
    expect(screen.getByText('Engine')).toBeInTheDocument()
    expect(screen.getByText('Capacities')).toBeInTheDocument()
    expect(screen.getByText('Maintenance')).toBeInTheDocument()
    expect(screen.getByText('Chassis')).toBeInTheDocument()
  })

  it('renders engine specs with formatted values', () => {
    render(<SpecSheet motorcycle={fullMotorcycle} />)
    expect(screen.getByText('inline-4')).toBeInTheDocument()
    expect(screen.getByText('599cc')).toBeInTheDocument()
    expect(screen.getByText('PGM-FI')).toBeInTheDocument()
    expect(screen.getByText('118 hp')).toBeInTheDocument()
    expect(screen.getByText('66 Nm')).toBeInTheDocument()
  })

  it('renders capacity specs with L suffix', () => {
    render(<SpecSheet motorcycle={fullMotorcycle} />)
    expect(screen.getByText('3.4L')).toBeInTheDocument()
    expect(screen.getByText('18L')).toBeInTheDocument()
    expect(screen.getByText('2.2L')).toBeInTheDocument()
  })

  it('renders maintenance specs', () => {
    render(<SpecSheet motorcycle={fullMotorcycle} />)
    expect(screen.getByText('0.16-0.20mm')).toBeInTheDocument()
    expect(screen.getByText('0.22-0.27mm')).toBeInTheDocument()
    expect(screen.getByText('IMR9C-9HES')).toBeInTheDocument()
  })

  it('renders chassis specs with formatted values', () => {
    render(<SpecSheet motorcycle={fullMotorcycle} />)
    expect(screen.getByText('155 kg')).toBeInTheDocument()
    expect(screen.getByText('120/70ZR17')).toBeInTheDocument()
    expect(screen.getByText('180/55ZR17')).toBeInTheDocument()
  })

  it('shows empty state when no specs available', () => {
    render(<SpecSheet motorcycle={minimalMotorcycle} />)
    expect(screen.getByText(/no specifications available/i)).toBeInTheDocument()
  })

  it('skips sections when all fields in that section are null', () => {
    const partialMotorcycle: Motorcycle = {
      ...minimalMotorcycle,
      engine_type: 'V-twin',
      displacement_cc: 1200,
    }
    render(<SpecSheet motorcycle={partialMotorcycle} />)
    expect(screen.getByText('Engine')).toBeInTheDocument()
    expect(screen.queryByText('Capacities')).not.toBeInTheDocument()
    expect(screen.queryByText('Maintenance')).not.toBeInTheDocument()
    expect(screen.queryByText('Chassis')).not.toBeInTheDocument()
  })

  it('renders correct labels for each spec', () => {
    render(<SpecSheet motorcycle={fullMotorcycle} />)
    expect(screen.getByText('Engine Type')).toBeInTheDocument()
    expect(screen.getByText('Displacement')).toBeInTheDocument()
    expect(screen.getByText('Fuel System')).toBeInTheDocument()
    expect(screen.getByText('Horsepower')).toBeInTheDocument()
    expect(screen.getByText('Torque')).toBeInTheDocument()
    expect(screen.getByText('Oil Capacity')).toBeInTheDocument()
    expect(screen.getByText('Fuel Capacity')).toBeInTheDocument()
    expect(screen.getByText('Coolant Capacity')).toBeInTheDocument()
    expect(screen.getByText('Valve Clearance (Intake)')).toBeInTheDocument()
    expect(screen.getByText('Valve Clearance (Exhaust)')).toBeInTheDocument()
    expect(screen.getByText('Spark Plug')).toBeInTheDocument()
    expect(screen.getByText('Dry Weight')).toBeInTheDocument()
    expect(screen.getByText('Front Tire')).toBeInTheDocument()
    expect(screen.getByText('Rear Tire')).toBeInTheDocument()
  })
})
