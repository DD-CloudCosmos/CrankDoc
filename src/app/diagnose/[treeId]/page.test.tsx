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

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
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

const mockUniversalTree = {
  ...mockTreeRow,
  id: 'tree-universal',
  motorcycle_id: null,
  title: 'General Maintenance',
}

const mockMotorcycle = {
  id: 'moto-1',
  make: 'Honda',
  model: 'CBR600RR',
}

function makeClientForTree(tree: typeof mockTreeRow, motorcycle: typeof mockMotorcycle | null = mockMotorcycle) {
  return {
    from: vi.fn((table: string) => {
      if (table === 'diagnostic_trees') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: tree,
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
              data: motorcycle,
              error: motorcycle ? null : { code: 'PGRST116', message: 'Not found' },
            })),
          })),
        })),
      }
    }),
  }
}

describe('DiagnoseTreePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the tree title and description', async () => {
    vi.mocked(createServerClient).mockReturnValue(makeClientForTree(mockTreeRow) as never)

    render(await DiagnoseTreePage({ params: Promise.resolve({ treeId: 'tree-1' }) }))
    expect(screen.getByText("Engine Won't Start")).toBeInTheDocument()
    expect(screen.getByText('Diagnosis for non-starting engine.')).toBeInTheDocument()
  })

  it('renders the TreeWalker with the first node', async () => {
    vi.mocked(createServerClient).mockReturnValue(makeClientForTree(mockTreeRow) as never)

    render(await DiagnoseTreePage({ params: Promise.resolve({ treeId: 'tree-1' }) }))
    expect(screen.getByText('Does the engine turn over?')).toBeInTheDocument()
    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
  })

  it('shows motorcycle name when motorcycle exists', async () => {
    vi.mocked(createServerClient).mockReturnValue(makeClientForTree(mockTreeRow) as never)

    render(await DiagnoseTreePage({ params: Promise.resolve({ treeId: 'tree-1' }) }))
    expect(screen.getByText(/Honda CBR600RR/)).toBeInTheDocument()
  })

  it('renders step indicator at step 3', async () => {
    vi.mocked(createServerClient).mockReturnValue(makeClientForTree(mockTreeRow) as never)

    render(await DiagnoseTreePage({ params: Promise.resolve({ treeId: 'tree-1' }) }))
    expect(screen.getByText('Select')).toBeInTheDocument()
    expect(screen.getByText('Symptom')).toBeInTheDocument()
    expect(screen.getByText('Fix')).toBeInTheDocument()
  })

  it('back link goes to /diagnose?bike=<motorcycle_id> when tree has motorcycle', async () => {
    vi.mocked(createServerClient).mockReturnValue(makeClientForTree(mockTreeRow) as never)

    render(await DiagnoseTreePage({ params: Promise.resolve({ treeId: 'tree-1' }) }))
    const backLink = screen.getByRole('link', { name: /back to symptoms/i })
    expect(backLink).toHaveAttribute('href', '/diagnose?bike=moto-1')
  })

  it('back link goes to /diagnose when tree has no motorcycle', async () => {
    vi.mocked(createServerClient).mockReturnValue(makeClientForTree(mockUniversalTree, null) as never)

    render(await DiagnoseTreePage({ params: Promise.resolve({ treeId: 'tree-universal' }) }))
    const backLink = screen.getByRole('link', { name: /back to symptoms/i })
    expect(backLink).toHaveAttribute('href', '/diagnose')
  })
})
