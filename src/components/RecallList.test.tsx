import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { RecallList } from './RecallList'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock RecallCard since it's tested separately
vi.mock('@/components/RecallCard', () => ({
  RecallCard: ({ recall }: { recall: { nhtsa_campaign_number: string } }) => (
    <div data-testid="recall-card">{recall.nhtsa_campaign_number}</div>
  ),
}))

function mockApiResponse(recalls: unknown[], total: number, page = 1, totalPages = 1) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ recalls, total, page, totalPages }),
  })
}

const mockRecalls = [
  {
    id: '1',
    nhtsa_campaign_number: '24V-001',
    data_source: 'nhtsa',
    manufacturer: 'Honda Motor Co.',
    make: 'HONDA',
    model: 'CBR600RR',
    model_year: 2021,
    component: 'ENGINE',
    summary: 'Engine may stall',
    consequence: null,
    remedy: null,
    notes: null,
    report_received_date: '2024-01-15',
    park_it: false,
    park_outside: false,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    nhtsa_campaign_number: '24V-002',
    data_source: 'nhtsa',
    manufacturer: 'Honda Motor Co.',
    make: 'HONDA',
    model: 'CBR600RR',
    model_year: 2022,
    component: 'BRAKES',
    summary: 'Brake line may leak',
    consequence: 'Loss of braking',
    remedy: 'Replace brake line',
    notes: null,
    report_received_date: '2024-02-20',
    park_it: true,
    park_outside: false,
    created_at: '2024-01-01T00:00:00Z',
  },
]

describe('RecallList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders search inputs for make, model, and year', async () => {
    mockApiResponse(mockRecalls, 2)

    render(<RecallList />)

    expect(screen.getByPlaceholderText('Make (e.g., Honda)')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Model (e.g., CBR600RR)')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Year')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {}))
    render(<RecallList />)
    expect(screen.getByText('Loading recalls...')).toBeInTheDocument()
  })

  it('shows recalls after fetch', async () => {
    mockApiResponse(mockRecalls, 2)

    render(<RecallList />)

    await waitFor(() => {
      expect(screen.getByText('24V-001')).toBeInTheDocument()
    })
    expect(screen.getByText('24V-002')).toBeInTheDocument()
    expect(screen.getByText('Showing 2 of 2 recalls')).toBeInTheDocument()
  })

  it('shows empty state when no results', async () => {
    mockApiResponse([], 0)

    render(<RecallList />)

    await waitFor(() => {
      expect(screen.getByText('No recalls available')).toBeInTheDocument()
    })
  })

  it('shows error state when fetch fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })

    render(<RecallList />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load recalls. Please try again.')).toBeInTheDocument()
    })
  })
})
