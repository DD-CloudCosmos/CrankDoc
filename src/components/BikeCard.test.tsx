import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BikeCard } from './BikeCard'
import type { Motorcycle } from '@/types/database.types'

describe('BikeCard', () => {
  const mockMotorcycle: Motorcycle = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    make: 'Honda',
    model: 'CBR600RR',
    year_start: 2003,
    year_end: 2024,
    engine_type: 'inline-4',
    displacement_cc: 599,
    category: 'sport',
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

  it('renders the motorcycle make and model', () => {
    render(<BikeCard motorcycle={mockMotorcycle} />)
    expect(screen.getByText(/Honda CBR600RR/i)).toBeInTheDocument()
  })

  it('renders the year range with end year', () => {
    render(<BikeCard motorcycle={mockMotorcycle} />)
    expect(screen.getByText('2003-2024')).toBeInTheDocument()
  })

  it('renders year range as "present" when year_end is null', () => {
    const currentMotorcycle = { ...mockMotorcycle, year_end: null }
    render(<BikeCard motorcycle={currentMotorcycle} />)
    expect(screen.getByText('2003-present')).toBeInTheDocument()
  })

  it('renders the engine type', () => {
    render(<BikeCard motorcycle={mockMotorcycle} />)
    expect(screen.getByText('inline-4')).toBeInTheDocument()
  })

  it('renders the displacement with cc suffix', () => {
    render(<BikeCard motorcycle={mockMotorcycle} />)
    expect(screen.getByText('599cc')).toBeInTheDocument()
  })

  it('renders N/A when displacement is not available', () => {
    const motorcycleNoDisplacement = { ...mockMotorcycle, displacement_cc: null }
    render(<BikeCard motorcycle={motorcycleNoDisplacement} />)
    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0)
  })

  it('renders N/A when engine type is not available', () => {
    const motorcycleNoEngine = { ...mockMotorcycle, engine_type: null }
    render(<BikeCard motorcycle={motorcycleNoEngine} />)
    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0)
  })

  it('renders the category badge with capitalized text', () => {
    render(<BikeCard motorcycle={mockMotorcycle} />)
    expect(screen.getByText('Sport')).toBeInTheDocument()
  })

  it('renders "Other" category when category is null', () => {
    const motorcycleNoCategory = { ...mockMotorcycle, category: null }
    render(<BikeCard motorcycle={motorcycleNoCategory} />)
    expect(screen.getByText('Other')).toBeInTheDocument()
  })

  it('renders as a link to the detail page', () => {
    render(<BikeCard motorcycle={mockMotorcycle} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/bikes/123e4567-e89b-12d3-a456-426614174000')
  })

  it('renders different category variants correctly', () => {
    const sportBike = { ...mockMotorcycle, category: 'sport' }
    const { rerender } = render(<BikeCard motorcycle={sportBike} />)
    expect(screen.getByText('Sport')).toBeInTheDocument()

    const nakedBike = { ...mockMotorcycle, category: 'naked' }
    rerender(<BikeCard motorcycle={nakedBike} />)
    expect(screen.getByText('Naked')).toBeInTheDocument()

    const cruiserBike = { ...mockMotorcycle, category: 'cruiser' }
    rerender(<BikeCard motorcycle={cruiserBike} />)
    expect(screen.getByText('Cruiser')).toBeInTheDocument()

    const adventureBike = { ...mockMotorcycle, category: 'adventure' }
    rerender(<BikeCard motorcycle={adventureBike} />)
    expect(screen.getByText('Adventure')).toBeInTheDocument()
  })

  it('renders generation badge when generation is set', () => {
    const motorcycleWithGen = {
      ...mockMotorcycle,
      generation: 'Gen 1',
    }
    render(<BikeCard motorcycle={motorcycleWithGen} />)
    expect(screen.getByText('Gen 1')).toBeInTheDocument()
  })

  it('does not render generation badge when generation is null', () => {
    render(<BikeCard motorcycle={mockMotorcycle} />)
    // Should not have any badge with generation-style text
    expect(screen.queryByText(/Gen \d/)).not.toBeInTheDocument()
  })

  it('renders horsepower when available', () => {
    const motorcycleWithHp = { ...mockMotorcycle, horsepower: 117 }
    render(<BikeCard motorcycle={motorcycleWithHp} />)
    expect(screen.getByText('117 hp')).toBeInTheDocument()
    expect(screen.getByText('Power:')).toBeInTheDocument()
  })

  it('does not render power row when horsepower is null', () => {
    render(<BikeCard motorcycle={mockMotorcycle} />)
    expect(screen.queryByText('Power:')).not.toBeInTheDocument()
  })

  it('renders dry weight when available', () => {
    const motorcycleWithWeight = { ...mockMotorcycle, dry_weight_kg: 186 }
    render(<BikeCard motorcycle={motorcycleWithWeight} />)
    expect(screen.getByText('186 kg')).toBeInTheDocument()
    expect(screen.getByText('Weight:')).toBeInTheDocument()
  })

  it('does not render weight row when dry_weight_kg is null', () => {
    render(<BikeCard motorcycle={mockMotorcycle} />)
    expect(screen.queryByText('Weight:')).not.toBeInTheDocument()
  })
})
