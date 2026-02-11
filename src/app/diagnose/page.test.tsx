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

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the page title', async () => {
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            data: mockTrees,
            error: null,
          })),
        })),
      })),
    }
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await DiagnosePage())
    expect(screen.getByRole('heading', { name: /diagnostic trees/i, level: 1 })).toBeInTheDocument()
  })

  it('displays diagnostic trees when data is loaded', async () => {
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            data: mockTrees,
            error: null,
          })),
        })),
      })),
    }
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await DiagnosePage())
    expect(screen.getByText("Engine Won't Start")).toBeInTheDocument()
    expect(screen.getByText("Won't Idle / Stalls")).toBeInTheDocument()
  })

  it('displays empty state when no trees exist', async () => {
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
    }
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await DiagnosePage())
    expect(screen.getByText(/no diagnostic trees available/i)).toBeInTheDocument()
  })

  it('displays error message when query fails', async () => {
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            data: null,
            error: { message: 'Query failed' },
          })),
        })),
      })),
    }
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await DiagnosePage())
    expect(screen.getByText(/error loading diagnostic trees/i)).toBeInTheDocument()
  })
})
