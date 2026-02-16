import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import BikesPage from './page'
import { createServerClient } from '@/lib/supabase/server'
import type { Motorcycle } from '@/types/database.types'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}))

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}))

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

describe('BikesPage', () => {
  const mockMotorcycles: Motorcycle[] = [
    {
      id: '1',
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
    },
    {
      id: '2',
      make: 'Yamaha',
      model: 'MT-07',
      year_start: 2014,
      year_end: null,
      engine_type: 'parallel-twin',
      displacement_cc: 689,
      category: 'naked',
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
    },
  ]

  // Build a deeply chainable mock that returns `this` for any method call,
  // with final data/error at any level
  function createChainMock(result: { data: unknown; error: unknown }) {
    const mock: Record<string, unknown> = {
      data: result.data,
      error: result.error,
    }
    const handler = {
      get(target: Record<string, unknown>, prop: string) {
        if (prop === 'data') return target.data
        if (prop === 'error') return target.error
        if (prop === 'then') return undefined // not a promise
        // Return a function that returns the same proxy for chaining
        return vi.fn(() => new Proxy({ ...mock }, handler))
      },
    }
    return new Proxy(mock, handler)
  }

  const createMockSupabaseClient = (
    motorcyclesData: Motorcycle[],
    makesData: { make: string }[],
    imagesData: { motorcycle_id: string; image_url: string; alt_text: string }[] = []
  ) => {
    return {
      from: vi.fn((table: string) => {
        if (table === 'motorcycles') {
          return createChainMock({ data: motorcyclesData, error: null })
        }
        if (table === 'motorcycle_images') {
          return createChainMock({ data: imagesData, error: null })
        }
        // For makes query
        return createChainMock({ data: makesData, error: null })
      }),
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the page title and description', async () => {
    const mockClient = createMockSupabaseClient(
      mockMotorcycles,
      [{ make: 'Honda' }, { make: 'Yamaha' }]
    )
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await BikesPage({ searchParams: Promise.resolve({}) }))

    expect(screen.getByRole('heading', { name: /motorcycle database/i, level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/browse specifications and technical data/i)).toBeInTheDocument()
  })

  it('displays motorcycles when data is loaded', async () => {
    const mockClient = createMockSupabaseClient(
      mockMotorcycles,
      [{ make: 'Honda' }, { make: 'Yamaha' }]
    )
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await BikesPage({ searchParams: Promise.resolve({}) }))

    // Both desktop table and mobile list render, so use getAllByText
    expect(screen.getAllByText(/Honda CBR600RR/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Yamaha MT-07/i).length).toBeGreaterThanOrEqual(1)
  })

  it('displays empty state when no motorcycles are found', async () => {
    const mockClient = createMockSupabaseClient([], [])
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await BikesPage({ searchParams: Promise.resolve({}) }))

    expect(screen.getByText(/no motorcycles found matching your filters/i)).toBeInTheDocument()
    expect(screen.getByText(/try adjusting your filter criteria/i)).toBeInTheDocument()
  })

  it('displays error message when database query fails', async () => {
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === 'motorcycles') {
          return createChainMock({ data: null, error: { message: 'Database connection failed' } })
        }
        // Makes and images queries
        return createChainMock({ data: null, error: { message: 'Database connection failed' } })
      }),
    }
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await BikesPage({ searchParams: Promise.resolve({}) }))

    expect(screen.getByText(/error loading motorcycles/i)).toBeInTheDocument()
    expect(screen.getByText(/failed to fetch motorcycles from database/i)).toBeInTheDocument()
  })

  it('filters motorcycles by category', async () => {
    const sportBikesOnly = mockMotorcycles.filter(m => m.category === 'sport')
    const mockClient = createMockSupabaseClient(
      sportBikesOnly,
      [{ make: 'Honda' }]
    )
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await BikesPage({ searchParams: Promise.resolve({ category: 'sport' }) }))

    expect(screen.getAllByText(/Honda CBR600RR/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText(/Yamaha MT-07/i)).not.toBeInTheDocument()
  })

  it('filters motorcycles by make', async () => {
    const hondaBikesOnly = mockMotorcycles.filter(m => m.make === 'Honda')
    const mockClient = createMockSupabaseClient(
      hondaBikesOnly,
      [{ make: 'Honda' }]
    )
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await BikesPage({ searchParams: Promise.resolve({ make: 'Honda' }) }))

    expect(screen.getAllByText(/Honda CBR600RR/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText(/Yamaha MT-07/i)).not.toBeInTheDocument()
  })

  it('renders filters component with available makes', async () => {
    const mockClient = createMockSupabaseClient(
      mockMotorcycles,
      [{ make: 'Honda' }, { make: 'Yamaha' }]
    )
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await BikesPage({ searchParams: Promise.resolve({}) }))

    expect(screen.getByText(/filters/i)).toBeInTheDocument()
  })

  it('shows result count in filters', async () => {
    const mockClient = createMockSupabaseClient(
      mockMotorcycles,
      [{ make: 'Honda' }, { make: 'Yamaha' }]
    )
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await BikesPage({ searchParams: Promise.resolve({}) }))

    expect(screen.getByText('Showing 2 motorcycles')).toBeInTheDocument()
  })
})
