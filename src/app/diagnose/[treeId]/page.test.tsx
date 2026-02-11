import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import DiagnoseTreePage from './page'
import { createServerClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}))

const mockTreeRow = {
  id: 'tree-1',
  motorcycle_id: 'moto-1',
  title: "Engine Won't Start",
  description: 'Diagnosis for non-starting engine.',
  category: 'electrical',
  difficulty: 'beginner',
  tree_data: {
    nodes: [
      {
        id: 'start',
        type: 'question',
        text: 'Does the engine turn over?',
        safety: 'green',
        options: [
          { text: 'Yes', next: 'solution1' },
          { text: 'No', next: 'solution2' },
        ],
      },
      {
        id: 'solution1',
        type: 'solution',
        text: 'Check spark plugs',
        safety: 'yellow',
        action: 'Replace spark plugs',
        details: 'Remove and inspect spark plugs.',
      },
      {
        id: 'solution2',
        type: 'solution',
        text: 'Check battery',
        safety: 'green',
        action: 'Charge battery',
        details: 'Use a battery charger.',
      },
    ],
  },
  created_at: '2024-01-01T00:00:00Z',
}

const mockMotorcycle = {
  id: 'moto-1',
  make: 'Honda',
  model: 'CBR600RR',
}

describe('DiagnoseTreePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the tree title and description', async () => {
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === 'diagnostic_trees') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: mockTreeRow,
                  error: null,
                })),
              })),
            })),
          }
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: mockMotorcycle,
                error: null,
              })),
            })),
          })),
        }
      }),
    }
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await DiagnoseTreePage({ params: Promise.resolve({ treeId: 'tree-1' }) }))
    expect(screen.getByText("Engine Won't Start")).toBeInTheDocument()
    expect(screen.getByText('Diagnosis for non-starting engine.')).toBeInTheDocument()
  })

  it('renders the TreeWalker with the first node', async () => {
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === 'diagnostic_trees') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: mockTreeRow,
                  error: null,
                })),
              })),
            })),
          }
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: mockMotorcycle,
                error: null,
              })),
            })),
          })),
        }
      }),
    }
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await DiagnoseTreePage({ params: Promise.resolve({ treeId: 'tree-1' }) }))
    expect(screen.getByText('Does the engine turn over?')).toBeInTheDocument()
    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
  })

  it('shows motorcycle name when motorcycle exists', async () => {
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === 'diagnostic_trees') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: mockTreeRow,
                  error: null,
                })),
              })),
            })),
          }
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: mockMotorcycle,
                error: null,
              })),
            })),
          })),
        }
      }),
    }
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await DiagnoseTreePage({ params: Promise.resolve({ treeId: 'tree-1' }) }))
    expect(screen.getByText(/Honda CBR600RR/)).toBeInTheDocument()
  })
})
