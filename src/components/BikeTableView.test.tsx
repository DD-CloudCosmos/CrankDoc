import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BikeTableView } from './BikeTableView'
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
    make: 'Yamaha',
    model: 'MT-07',
    year_start: 2014,
    year_end: null,
    engine_type: 'Parallel twin',
    displacement_cc: 689,
    category: 'naked',
    image_url: null,
    generation: null,
    fuel_system: 'EFI',
    dry_weight_kg: 182,
    horsepower: 74,
    torque_nm: 68,
    fuel_capacity_liters: 14,
    oil_capacity_liters: 3.0,
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

describe('BikeTableView', () => {
  it('renders motorcycle names', () => {
    render(<BikeTableView motorcycles={mockMotorcycles} sort="make" sortDir="asc" />)
    // Text appears in both desktop table and mobile list
    expect(screen.getAllByText('Honda CBR600RR').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Yamaha MT-07').length).toBeGreaterThanOrEqual(1)
  })

  it('renders category badges', () => {
    render(<BikeTableView motorcycles={mockMotorcycles} sort="make" sortDir="asc" />)
    expect(screen.getAllByText('Sport').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Naked').length).toBeGreaterThan(0)
  })

  it('renders displacement values', () => {
    render(<BikeTableView motorcycles={mockMotorcycles} sort="make" sortDir="asc" />)
    expect(screen.getAllByText('599cc').length).toBeGreaterThan(0)
    expect(screen.getAllByText('689cc').length).toBeGreaterThan(0)
  })

  it('renders year ranges', () => {
    render(<BikeTableView motorcycles={mockMotorcycles} sort="make" sortDir="asc" />)
    expect(screen.getAllByText('2003–2024').length).toBeGreaterThan(0)
    expect(screen.getAllByText('2014–present').length).toBeGreaterThan(0)
  })

  it('renders links to detail pages', () => {
    render(<BikeTableView motorcycles={mockMotorcycles} sort="make" sortDir="asc" />)
    const links = screen.getAllByRole('link')
    const hrefs = links.map((l) => l.getAttribute('href'))
    expect(hrefs).toContain('/bikes/moto-1')
    expect(hrefs).toContain('/bikes/moto-2')
  })

  it('renders sortable column headers', () => {
    render(<BikeTableView motorcycles={mockMotorcycles} sort="make" sortDir="asc" />)
    expect(screen.getByTestId('sort-make')).toBeInTheDocument()
    expect(screen.getByTestId('sort-horsepower')).toBeInTheDocument()
    expect(screen.getByTestId('sort-displacement_cc')).toBeInTheDocument()
  })

  it('shows empty state when no motorcycles', () => {
    render(<BikeTableView motorcycles={[]} sort="make" sortDir="asc" />)
    expect(screen.getByText('No motorcycles found matching your filters.')).toBeInTheDocument()
  })

  it('renders thumbnail images', () => {
    render(<BikeTableView motorcycles={mockMotorcycles} sort="make" sortDir="asc" />)
    // Image appears in both desktop and mobile views
    const imgs = screen.getAllByAltText('Honda CBR600RR')
    expect(imgs.length).toBeGreaterThanOrEqual(1)
  })

  it('renders HP values', () => {
    render(<BikeTableView motorcycles={mockMotorcycles} sort="make" sortDir="asc" />)
    expect(screen.getAllByText('118').length).toBeGreaterThan(0)
    expect(screen.getAllByText('74').length).toBeGreaterThan(0)
  })

  it('renders weight values', () => {
    render(<BikeTableView motorcycles={mockMotorcycles} sort="make" sortDir="asc" />)
    expect(screen.getAllByText('186 kg').length).toBeGreaterThan(0)
    expect(screen.getAllByText('182 kg').length).toBeGreaterThan(0)
  })
})
