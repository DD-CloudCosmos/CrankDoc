import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BikeGridView } from './BikeGridView'
import type { MotorcycleWithImage } from '@/app/bikes/page'

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

const mockMotorcycles: MotorcycleWithImage[] = [
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
    primaryImage: {
      image_url: 'https://example.com/cbr600rr.jpg',
      alt_text: 'Honda CBR600RR',
    },
  },
  {
    id: 'moto-2',
    make: 'Kymco',
    model: 'AK 550i',
    year_start: 2017,
    year_end: null,
    engine_type: 'Parallel twin',
    displacement_cc: 550,
    category: 'scooter',
    image_url: null,
    generation: null,
    fuel_system: 'EFI',
    dry_weight_kg: 226,
    horsepower: 53,
    torque_nm: 55,
    fuel_capacity_liters: 15,
    oil_capacity_liters: null,
    coolant_capacity_liters: null,
    valve_clearance_intake: null,
    valve_clearance_exhaust: null,
    spark_plug: null,
    tire_front: null,
    tire_rear: null,
    created_at: '2024-01-01T00:00:00Z',
    primaryImage: null,
  },
]

describe('BikeGridView', () => {
  it('renders motorcycle make and model', () => {
    render(<BikeGridView motorcycles={mockMotorcycles} />)
    // Honda has an image, so text only appears in overlay
    expect(screen.getByText('Honda CBR600RR')).toBeInTheDocument()
    // Kymco has no image, so text appears in both overlay and placeholder
    expect(screen.getAllByText('Kymco AK 550i').length).toBeGreaterThanOrEqual(1)
  })

  it('renders year ranges', () => {
    render(<BikeGridView motorcycles={mockMotorcycles} />)
    expect(screen.getByText('2003–2024')).toBeInTheDocument()
    expect(screen.getByText('2017–present')).toBeInTheDocument()
  })

  it('renders category badges', () => {
    render(<BikeGridView motorcycles={mockMotorcycles} />)
    expect(screen.getByText('Sport')).toBeInTheDocument()
    expect(screen.getByText('Scooter')).toBeInTheDocument()
  })

  it('renders specs inline', () => {
    render(<BikeGridView motorcycles={mockMotorcycles} />)
    expect(screen.getByText('599cc · 118 hp')).toBeInTheDocument()
    expect(screen.getByText('550cc · 53 hp')).toBeInTheDocument()
  })

  it('renders links to detail pages', () => {
    render(<BikeGridView motorcycles={mockMotorcycles} />)
    const links = screen.getAllByRole('link')
    const hrefs = links.map((l) => l.getAttribute('href'))
    expect(hrefs).toContain('/bikes/moto-1')
    expect(hrefs).toContain('/bikes/moto-2')
  })

  it('renders images when available', () => {
    render(<BikeGridView motorcycles={mockMotorcycles} />)
    const img = screen.getByAltText('Honda CBR600RR')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/cbr600rr.jpg')
  })

  it('shows empty state when no motorcycles', () => {
    render(<BikeGridView motorcycles={[]} />)
    expect(screen.getByText('No motorcycles found matching your filters.')).toBeInTheDocument()
  })
})
