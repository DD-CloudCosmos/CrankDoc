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

  const createMockSupabaseClient = (motorcyclesData: Motorcycle[], makesData: { make: string }[]) => {
    return {
      from: vi.fn((table: string) => {
        if (table === 'motorcycles') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => ({
                order: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    data: motorcyclesData,
                    error: null,
                  })),
                  data: motorcyclesData,
                  error: null,
                })),
                eq: vi.fn(() => ({
                  data: motorcyclesData,
                  error: null,
                })),
                data: motorcyclesData,
                error: null,
              })),
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  order: vi.fn(() => ({
                    data: motorcyclesData,
                    error: null,
                  })),
                  data: motorcyclesData,
                  error: null,
                })),
                data: motorcyclesData,
                error: null,
              })),
              data: motorcyclesData,
              error: null,
            })),
          }
        }
        // For makes query
        return {
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              data: makesData,
              error: null,
            })),
          })),
        }
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

    expect(screen.getByText(/Honda CBR600RR/i)).toBeInTheDocument()
    expect(screen.getByText(/Yamaha MT-07/i)).toBeInTheDocument()
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
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            order: vi.fn(() => ({
              data: null,
              error: { message: 'Database connection failed' },
            })),
            data: null,
            error: { message: 'Database connection failed' },
          })),
          data: null,
          error: { message: 'Database connection failed' },
        })),
      })),
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

    expect(screen.getByText(/Honda CBR600RR/i)).toBeInTheDocument()
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

    expect(screen.getByText(/Honda CBR600RR/i)).toBeInTheDocument()
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
})
