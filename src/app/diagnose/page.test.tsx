import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import DiagnosePage from './page'
import { createServerClient } from '@/lib/supabase/server'
import type { DiagnosticTree } from '@/types/database.types'

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}))

describe('DiagnosePage', () => {
  const mockTrees: DiagnosticTree[] = [
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
  ]

  const mockMotorcycle = {
    id: 'moto-1',
    make: 'Honda',
    model: 'CBR600RR',
    year_start: 2007,
    year_end: 2012,
    category: 'sport',
    generation: '2007-2012',
    created_at: '2024-01-01T00:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  function makeUnfilteredClient(data: DiagnosticTree[] | null, error: { message: string } | null = null) {
    return {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            data,
            error,
          })),
          or: vi.fn(() => ({
            order: vi.fn(() => ({
              data,
              error,
            })),
          })),
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            })),
          })),
        })),
      })),
    }
  }

  it('renders the page title', async () => {
    vi.mocked(createServerClient).mockReturnValue(makeUnfilteredClient(mockTrees) as never)

    render(await DiagnosePage({ searchParams: Promise.resolve({}) }))
    expect(screen.getByRole('heading', { name: /diagnostic trees/i, level: 1 })).toBeInTheDocument()
  })

  it('displays diagnostic trees when data is loaded', async () => {
    vi.mocked(createServerClient).mockReturnValue(makeUnfilteredClient(mockTrees) as never)

    render(await DiagnosePage({ searchParams: Promise.resolve({}) }))
    expect(screen.getByText("Engine Won't Start")).toBeInTheDocument()
    expect(screen.getByText("Won't Idle / Stalls")).toBeInTheDocument()
  })

  it('displays empty state when no trees exist', async () => {
    vi.mocked(createServerClient).mockReturnValue(makeUnfilteredClient([]) as never)

    render(await DiagnosePage({ searchParams: Promise.resolve({}) }))
    expect(screen.getByText(/no diagnostic trees available yet/i)).toBeInTheDocument()
  })

  it('displays error message when query fails', async () => {
    vi.mocked(createServerClient).mockReturnValue(
      makeUnfilteredClient(null, { message: 'Query failed' }) as never
    )

    render(await DiagnosePage({ searchParams: Promise.resolve({}) }))
    expect(screen.getByText(/error loading diagnostic trees/i)).toBeInTheDocument()
  })

  it('shows no badge or filter when no query param is provided', async () => {
    vi.mocked(createServerClient).mockReturnValue(makeUnfilteredClient(mockTrees) as never)

    render(await DiagnosePage({ searchParams: Promise.resolve({}) }))
    expect(screen.queryByText('View all guides')).not.toBeInTheDocument()
    expect(screen.queryByText('Honda CBR600RR')).not.toBeInTheDocument()
  })

  it('displays motorcycle name badge when filtered by bike', async () => {
    const filteredTrees = [mockTrees[0]]
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === 'motorcycles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: mockMotorcycle,
                  error: null,
                })),
              })),
              order: vi.fn(() => ({
                data: filteredTrees,
                error: null,
              })),
              or: vi.fn(() => ({
                order: vi.fn(() => ({
                  data: filteredTrees,
                  error: null,
                })),
              })),
            })),
          }
        }
        return {
          select: vi.fn(() => ({
            or: vi.fn(() => ({
              order: vi.fn(() => ({
                data: filteredTrees,
                error: null,
              })),
            })),
            order: vi.fn(() => ({
              data: filteredTrees,
              error: null,
            })),
          })),
        }
      }),
    }
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await DiagnosePage({ searchParams: Promise.resolve({ bike: 'moto-1' }) }))
    expect(screen.getByText('Honda CBR600RR')).toBeInTheDocument()
  })

  it('shows "View all guides" button when filtered', async () => {
    const filteredTrees = [mockTrees[0]]
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === 'motorcycles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: mockMotorcycle,
                  error: null,
                })),
              })),
              order: vi.fn(() => ({
                data: filteredTrees,
                error: null,
              })),
              or: vi.fn(() => ({
                order: vi.fn(() => ({
                  data: filteredTrees,
                  error: null,
                })),
              })),
            })),
          }
        }
        return {
          select: vi.fn(() => ({
            or: vi.fn(() => ({
              order: vi.fn(() => ({
                data: filteredTrees,
                error: null,
              })),
            })),
            order: vi.fn(() => ({
              data: filteredTrees,
              error: null,
            })),
          })),
        }
      }),
    }
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await DiagnosePage({ searchParams: Promise.resolve({ bike: 'moto-1' }) }))
    expect(screen.getByText('View all guides')).toBeInTheDocument()
  })

  it('renders filtered trees when bike query param is provided', async () => {
    const filteredTrees = [mockTrees[0]]
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === 'motorcycles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: mockMotorcycle,
                  error: null,
                })),
              })),
              order: vi.fn(() => ({
                data: filteredTrees,
                error: null,
              })),
              or: vi.fn(() => ({
                order: vi.fn(() => ({
                  data: filteredTrees,
                  error: null,
                })),
              })),
            })),
          }
        }
        return {
          select: vi.fn(() => ({
            or: vi.fn(() => ({
              order: vi.fn(() => ({
                data: filteredTrees,
                error: null,
              })),
            })),
            order: vi.fn(() => ({
              data: filteredTrees,
              error: null,
            })),
          })),
        }
      }),
    }
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await DiagnosePage({ searchParams: Promise.resolve({ bike: 'moto-1' }) }))
    expect(screen.getByText("Engine Won't Start")).toBeInTheDocument()
    expect(screen.queryByText("Won't Idle / Stalls")).not.toBeInTheDocument()
  })

  it('handles invalid bike ID gracefully', async () => {
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === 'motorcycles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: null,
                  error: { code: 'PGRST116', message: 'Not found' },
                })),
              })),
              order: vi.fn(() => ({
                data: [],
                error: null,
              })),
              or: vi.fn(() => ({
                order: vi.fn(() => ({
                  data: [],
                  error: null,
                })),
              })),
            })),
          }
        }
        return {
          select: vi.fn(() => ({
            or: vi.fn(() => ({
              order: vi.fn(() => ({
                data: [],
                error: null,
              })),
            })),
            order: vi.fn(() => ({
              data: [],
              error: null,
            })),
          })),
        }
      }),
    }
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await DiagnosePage({ searchParams: Promise.resolve({ bike: 'invalid-id' }) }))
    // Page should still render without crashing
    expect(screen.getByRole('heading', { name: /diagnostic trees/i, level: 1 })).toBeInTheDocument()
    // No badge shown since motorcycle wasn't found
    expect(screen.queryByText('View all guides')).not.toBeInTheDocument()
  })

  it('shows filtered empty state when bike has no trees', async () => {
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === 'motorcycles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: mockMotorcycle,
                  error: null,
                })),
              })),
              order: vi.fn(() => ({
                data: [],
                error: null,
              })),
              or: vi.fn(() => ({
                order: vi.fn(() => ({
                  data: [],
                  error: null,
                })),
              })),
            })),
          }
        }
        return {
          select: vi.fn(() => ({
            or: vi.fn(() => ({
              order: vi.fn(() => ({
                data: [],
                error: null,
              })),
            })),
            order: vi.fn(() => ({
              data: [],
              error: null,
            })),
          })),
        }
      }),
    }
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await DiagnosePage({ searchParams: Promise.resolve({ bike: 'moto-1' }) }))
    expect(screen.getByText(/no diagnostic trees available for this motorcycle yet/i)).toBeInTheDocument()
    expect(screen.getByText('View all diagnostic guides')).toBeInTheDocument()
  })
})
