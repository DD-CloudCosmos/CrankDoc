import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DiagnoseBikeSelector } from './DiagnoseBikeSelector'
import type { Motorcycle } from '@/types/database.types'

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// Mock lucide-react ChevronRight
vi.mock('lucide-react', () => ({
  ChevronRight: () => <span data-testid="chevron-right" />,
}))

const mockMotorcycles: Motorcycle[] = [
  {
    id: 'moto-1',
    make: 'Honda',
    model: 'CBR600RR',
    year_start: 2003,
    year_end: 2024,
    engine_type: 'Inline-4',
    displacement_cc: 599,
    category: 'sport',
    image_url: null,
    generation: null,
    fuel_system: 'EFI',
    dry_weight_kg: 186,
    horsepower: 118,
    torque_nm: 66,
    fuel_capacity_liters: 18,
    oil_capacity_liters: 3.4,
    coolant_capacity_liters: null,
    valve_clearance_intake: null,
    valve_clearance_exhaust: null,
    spark_plug: null,
    tire_front: null,
    tire_rear: null,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'moto-2',
    make: 'Yamaha',
    model: 'MT-07',
    year_start: 2014,
    year_end: null,
    engine_type: 'Parallel-Twin',
    displacement_cc: 689,
    category: 'naked',
    image_url: null,
    generation: null,
    fuel_system: 'EFI',
    dry_weight_kg: 182,
    horsepower: 73,
    torque_nm: 67,
    fuel_capacity_liters: 14,
    oil_capacity_liters: 3.0,
    coolant_capacity_liters: null,
    valve_clearance_intake: null,
    valve_clearance_exhaust: null,
    spark_plug: null,
    tire_front: null,
    tire_rear: null,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'moto-3',
    make: 'Kymco',
    model: 'Agility 125',
    year_start: 2015,
    year_end: null,
    engine_type: 'Single',
    displacement_cc: 125,
    category: 'scooter',
    image_url: null,
    generation: 'Gen 1 (2015-present)',
    fuel_system: 'Carbureted',
    dry_weight_kg: 115,
    horsepower: 10,
    torque_nm: 9,
    fuel_capacity_liters: 6,
    oil_capacity_liters: 0.8,
    coolant_capacity_liters: null,
    valve_clearance_intake: null,
    valve_clearance_exhaust: null,
    spark_plug: null,
    tire_front: null,
    tire_rear: null,
    created_at: '2024-01-01T00:00:00Z',
  },
]

const mockTreeCounts: Record<string, number> = {
  'moto-1': 7,
  'moto-2': 7,
  'moto-3': 8,
}

describe('DiagnoseBikeSelector', () => {
  it('renders all motorcycles when "All" is selected', () => {
    render(<DiagnoseBikeSelector motorcycles={mockMotorcycles} treeCounts={mockTreeCounts} />)

    expect(screen.getByText('Honda CBR600RR')).toBeInTheDocument()
    expect(screen.getByText('Yamaha MT-07')).toBeInTheDocument()
    expect(screen.getByText('Kymco Agility 125')).toBeInTheDocument()
  })

  it('renders heading and description', () => {
    render(<DiagnoseBikeSelector motorcycles={mockMotorcycles} treeCounts={mockTreeCounts} />)

    expect(screen.getByText('Select Your Motorcycle')).toBeInTheDocument()
    expect(screen.getByText('Choose your bike to start')).toBeInTheDocument()
  })

  it('renders all category filter buttons', () => {
    render(<DiagnoseBikeSelector motorcycles={mockMotorcycles} treeCounts={mockTreeCounts} />)

    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sport' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Naked' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cruiser' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Adventure' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Scooter' })).toBeInTheDocument()
  })

  it('filters motorcycles when a category button is clicked', async () => {
    const user = userEvent.setup()
    render(<DiagnoseBikeSelector motorcycles={mockMotorcycles} treeCounts={mockTreeCounts} />)

    await user.click(screen.getByRole('button', { name: 'Sport' }))

    expect(screen.getByText('Honda CBR600RR')).toBeInTheDocument()
    expect(screen.queryByText('Yamaha MT-07')).not.toBeInTheDocument()
    expect(screen.queryByText('Kymco Agility 125')).not.toBeInTheDocument()
  })

  it('shows all motorcycles again when "All" is clicked after filtering', async () => {
    const user = userEvent.setup()
    render(<DiagnoseBikeSelector motorcycles={mockMotorcycles} treeCounts={mockTreeCounts} />)

    await user.click(screen.getByRole('button', { name: 'Scooter' }))
    expect(screen.queryByText('Honda CBR600RR')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'All' }))
    expect(screen.getByText('Honda CBR600RR')).toBeInTheDocument()
    expect(screen.getByText('Yamaha MT-07')).toBeInTheDocument()
    expect(screen.getByText('Kymco Agility 125')).toBeInTheDocument()
  })

  it('bike rows contain correct Link hrefs', () => {
    render(<DiagnoseBikeSelector motorcycles={mockMotorcycles} treeCounts={mockTreeCounts} />)

    const hondaLink = screen.getByText('Honda CBR600RR').closest('a')
    expect(hondaLink).toHaveAttribute('href', '/diagnose?bike=moto-1')

    const yamahaLink = screen.getByText('Yamaha MT-07').closest('a')
    expect(yamahaLink).toHaveAttribute('href', '/diagnose?bike=moto-2')

    const kymcoLink = screen.getByText('Kymco Agility 125').closest('a')
    expect(kymcoLink).toHaveAttribute('href', '/diagnose?bike=moto-3')
  })

  it('displays tree counts for each motorcycle', () => {
    render(<DiagnoseBikeSelector motorcycles={mockMotorcycles} treeCounts={mockTreeCounts} />)

    const sevenGuides = screen.getAllByText('7 guides')
    expect(sevenGuides).toHaveLength(2) // Honda and Yamaha both have 7
    expect(screen.getByText('8 guides')).toBeInTheDocument()
  })

  it('shows year range when no generation is set', () => {
    render(<DiagnoseBikeSelector motorcycles={mockMotorcycles} treeCounts={mockTreeCounts} />)

    // Honda CBR600RR: year_start=2003, year_end=2024, no generation
    expect(screen.getByText(/2003-2024/)).toBeInTheDocument()

    // Yamaha MT-07: year_start=2014, year_end=null, no generation
    expect(screen.getByText(/2014-present/)).toBeInTheDocument()
  })

  it('shows generation name when set instead of year range', () => {
    render(<DiagnoseBikeSelector motorcycles={mockMotorcycles} treeCounts={mockTreeCounts} />)

    // Kymco Agility 125 has generation set
    expect(screen.getByText(/Gen 1 \(2015-present\)/)).toBeInTheDocument()
  })

  it('shows category and displacement info', () => {
    render(<DiagnoseBikeSelector motorcycles={mockMotorcycles} treeCounts={mockTreeCounts} />)

    // Check the detail text lines contain category and displacement
    expect(screen.getByText(/· Sport · 599cc/)).toBeInTheDocument()
    expect(screen.getByText(/· Naked · 689cc/)).toBeInTheDocument()
    expect(screen.getByText(/· Scooter · 125cc/)).toBeInTheDocument()
  })

  it('renders general guides link', () => {
    render(<DiagnoseBikeSelector motorcycles={mockMotorcycles} treeCounts={mockTreeCounts} />)

    const generalLink = screen.getByText(/Browse general guides/)
    expect(generalLink).toBeInTheDocument()
    expect(generalLink.closest('a')).toHaveAttribute('href', '/diagnose?bike=general')
  })

  it('renders "Don\'t know your model?" text', () => {
    render(<DiagnoseBikeSelector motorcycles={mockMotorcycles} treeCounts={mockTreeCounts} />)

    expect(screen.getByText(/Don't know your model/)).toBeInTheDocument()
  })

  it('shows empty list when filtering by category with no matches', async () => {
    const user = userEvent.setup()
    render(<DiagnoseBikeSelector motorcycles={mockMotorcycles} treeCounts={mockTreeCounts} />)

    await user.click(screen.getByRole('button', { name: 'Cruiser' }))

    expect(screen.queryByText('Honda CBR600RR')).not.toBeInTheDocument()
    expect(screen.queryByText('Yamaha MT-07')).not.toBeInTheDocument()
    expect(screen.queryByText('Kymco Agility 125')).not.toBeInTheDocument()
  })

  it('does not show tree count when count is 0 or missing', () => {
    const emptyTreeCounts: Record<string, number> = {}
    render(<DiagnoseBikeSelector motorcycles={mockMotorcycles} treeCounts={emptyTreeCounts} />)

    // Should not show any "N guides" text (but "Browse general guides" is still there)
    expect(screen.queryByText(/\d+ guides/)).not.toBeInTheDocument()
  })
})
