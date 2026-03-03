import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import DiagnosePage from './page'
import { createServerClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

const mockMotorcycles = [
  {
    id: 'moto-1',
    make: 'Honda',
    model: 'CBR600RR',
    year_start: 2007,
    year_end: 2012,
    category: 'sport',
    generation: 'EFI 2007-2012',
    displacement_cc: 599,
    engine_type: 'Inline-4',
    image_url: null,
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
    category: 'naked',
    generation: null,
    displacement_cc: 689,
    engine_type: 'Parallel-Twin',
    image_url: null,
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
]

const mockTrees = [
  {
    id: 'tree-1',
    motorcycle_id: 'moto-1',
    title: "Engine Won't Start",
    description: 'Diagnosis for non-starting engine.',
    category: 'electrical',
    difficulty: 'beginner',
    tree_data: { nodes: [] },
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tree-2',
    motorcycle_id: 'moto-2',
    title: "Won't Idle / Stalls",
    description: 'Diagnose idle issues.',
    category: 'fuel',
    difficulty: 'intermediate',
    tree_data: { nodes: [] },
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tree-3',
    motorcycle_id: null,
    title: 'General Maintenance Check',
    description: 'Universal maintenance guide.',
    category: 'general',
    difficulty: 'beginner',
    tree_data: { nodes: [] },
    created_at: '2024-01-01T00:00:00Z',
  },
]

describe('DiagnosePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Step 1 — no bike param', () => {
    function makeStep1Client() {
      return {
        from: vi.fn((table: string) => {
          if (table === 'motorcycles') {
            return {
              select: vi.fn(() => ({
                order: vi.fn(() => ({
                  data: mockMotorcycles,
                  error: null,
                })),
              })),
            }
          }
          // diagnostic_trees — for tree counts
          return {
            select: vi.fn(() => ({
              data: mockTrees,
              error: null,
            })),
          }
        }),
      }
    }

    it('renders the step indicator at step 1', async () => {
      vi.mocked(createServerClient).mockReturnValue(makeStep1Client() as never)

      render(await DiagnosePage({ searchParams: Promise.resolve({}) }))
      // Step 1 is active — "Select" label visible, step indicator renders "1"
      expect(screen.getByText('Select')).toBeInTheDocument()
      expect(screen.getByText('Symptom')).toBeInTheDocument()
      expect(screen.getByText('Fix')).toBeInTheDocument()
    })

    it('renders the bike selector with motorcycles', async () => {
      vi.mocked(createServerClient).mockReturnValue(makeStep1Client() as never)

      render(await DiagnosePage({ searchParams: Promise.resolve({}) }))
      expect(screen.getByText('Select Your Motorcycle')).toBeInTheDocument()
      expect(screen.getByText('Honda CBR600RR')).toBeInTheDocument()
      expect(screen.getByText('Yamaha MT-07')).toBeInTheDocument()
    })

    it('renders category filter buttons', async () => {
      vi.mocked(createServerClient).mockReturnValue(makeStep1Client() as never)

      render(await DiagnosePage({ searchParams: Promise.resolve({}) }))
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Sport' })).toBeInTheDocument()
    })

    it('renders general guides link', async () => {
      vi.mocked(createServerClient).mockReturnValue(makeStep1Client() as never)

      render(await DiagnosePage({ searchParams: Promise.resolve({}) }))
      expect(screen.getByText(/Browse general guides/)).toBeInTheDocument()
    })
  })

  describe('Step 2 — specific bike param', () => {
    function makeStep2Client() {
      return {
        from: vi.fn((table: string) => {
          if (table === 'motorcycles') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => ({
                    data: mockMotorcycles[0],
                    error: null,
                  })),
                })),
              })),
            }
          }
          // diagnostic_trees for specific bike
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  order: vi.fn(() => ({
                    data: [mockTrees[0]],
                    error: null,
                  })),
                })),
              })),
            })),
          }
        }),
      }
    }

    it('renders the step indicator at step 2', async () => {
      vi.mocked(createServerClient).mockReturnValue(makeStep2Client() as never)

      render(await DiagnosePage({ searchParams: Promise.resolve({ bike: 'moto-1' }) }))
      expect(screen.getByText('Select')).toBeInTheDocument()
      expect(screen.getByText('Symptom')).toBeInTheDocument()
    })

    it('renders the symptom list with bike context', async () => {
      vi.mocked(createServerClient).mockReturnValue(makeStep2Client() as never)

      render(await DiagnosePage({ searchParams: Promise.resolve({ bike: 'moto-1' }) }))
      expect(screen.getByText('Honda CBR600RR')).toBeInTheDocument()
      expect(screen.getByText(/What's the problem/i)).toBeInTheDocument()
    })

    it('shows Change link back to bike selection', async () => {
      vi.mocked(createServerClient).mockReturnValue(makeStep2Client() as never)

      render(await DiagnosePage({ searchParams: Promise.resolve({ bike: 'moto-1' }) }))
      expect(screen.getByRole('link', { name: /change/i })).toHaveAttribute('href', '/diagnose')
    })

    it('renders tree rows', async () => {
      vi.mocked(createServerClient).mockReturnValue(makeStep2Client() as never)

      render(await DiagnosePage({ searchParams: Promise.resolve({ bike: 'moto-1' }) }))
      expect(screen.getByText("Engine Won't Start")).toBeInTheDocument()
    })
  })

  describe('Step 2 — general mode', () => {
    function makeGeneralClient() {
      return {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            is: vi.fn(() => ({
              order: vi.fn(() => ({
                order: vi.fn(() => ({
                  data: [mockTrees[2]],
                  error: null,
                })),
              })),
            })),
          })),
        })),
      }
    }

    it('renders general guides context bar', async () => {
      vi.mocked(createServerClient).mockReturnValue(makeGeneralClient() as never)

      render(await DiagnosePage({ searchParams: Promise.resolve({ bike: 'general' }) }))
      expect(screen.getByText('General Guides')).toBeInTheDocument()
      expect(screen.getByText('Universal troubleshooting for all motorcycles')).toBeInTheDocument()
    })

    it('renders universal trees', async () => {
      vi.mocked(createServerClient).mockReturnValue(makeGeneralClient() as never)

      render(await DiagnosePage({ searchParams: Promise.resolve({ bike: 'general' }) }))
      expect(screen.getByText('General Maintenance Check')).toBeInTheDocument()
    })
  })
})
