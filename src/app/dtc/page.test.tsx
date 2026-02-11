import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import DtcPage from './page'
import { createServerClient } from '@/lib/supabase/server'
import type { DtcCode } from '@/types/database.types'

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}))

describe('DtcPage', () => {
  const mockCodes: DtcCode[] = [
    {
      id: '1',
      code: 'P0301',
      description: 'Cylinder 1 Misfire Detected',
      category: 'powertrain',
      common_causes: ['Faulty spark plug'],
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      code: 'P0562',
      description: 'System Voltage Low',
      category: 'powertrain',
      common_causes: ['Weak battery'],
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
            data: mockCodes,
            error: null,
          })),
        })),
      })),
    }
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await DtcPage())
    expect(screen.getByRole('heading', { name: /dtc lookup/i, level: 1 })).toBeInTheDocument()
  })

  it('displays DTC codes', async () => {
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            data: mockCodes,
            error: null,
          })),
        })),
      })),
    }
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await DtcPage())
    expect(screen.getByText('P0301')).toBeInTheDocument()
    expect(screen.getByText('P0562')).toBeInTheDocument()
  })

  it('displays error state when query fails', async () => {
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            data: null,
            error: { message: 'Failed' },
          })),
        })),
      })),
    }
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await DtcPage())
    expect(screen.getByText(/error loading dtc codes/i)).toBeInTheDocument()
  })
})
