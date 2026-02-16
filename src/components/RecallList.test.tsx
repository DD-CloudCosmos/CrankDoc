import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecallList } from './RecallList'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}))

function mockRecallsResponse(recalls: unknown[], total: number, page = 1, totalPages = 1) {
  return {
    ok: true,
    json: async () => ({ recalls, total, page, totalPages }),
  }
}

function mockFiltersResponse(makes: string[] = [], models: string[] = [], years: number[] = []) {
  return {
    ok: true,
    json: async () => ({ makes, models, years }),
  }
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
    consequence: 'Risk of crash',
    remedy: 'Dealers will update software',
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

  it('renders dropdown filters for make, model, and year', async () => {
    // First call: filters API, Second call: recalls API
    mockFetch
      .mockResolvedValueOnce(mockFiltersResponse(['BMW', 'HONDA'], ['CBR600RR', 'R 1250 GS'], [2021, 2022]))
      .mockResolvedValueOnce(mockRecallsResponse(mockRecalls, 2))

    render(<RecallList />)

    await waitFor(() => {
      expect(screen.getByLabelText('Filter by make')).toBeInTheDocument()
    })
    expect(screen.getByLabelText('Filter by model')).toBeInTheDocument()
    expect(screen.getByLabelText('Filter by year')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    mockFetch.mockReturnValue(new Promise(() => {}))
    render(<RecallList />)
    expect(screen.getByText('Loading recalls...')).toBeInTheDocument()
  })

  it('shows recalls in a table after fetch', async () => {
    mockFetch
      .mockResolvedValueOnce(mockFiltersResponse())
      .mockResolvedValueOnce(mockRecallsResponse(mockRecalls, 2))

    render(<RecallList />)

    await waitFor(() => {
      expect(screen.getByText('24V-001')).toBeInTheDocument()
    })
    expect(screen.getByText('24V-002')).toBeInTheDocument()
    expect(screen.getByText('Showing 2 of 2 recalls')).toBeInTheDocument()
  })

  it('shows empty state when no results', async () => {
    mockFetch
      .mockResolvedValueOnce(mockFiltersResponse())
      .mockResolvedValueOnce(mockRecallsResponse([], 0))

    render(<RecallList />)

    await waitFor(() => {
      expect(screen.getByText('No recalls available')).toBeInTheDocument()
    })
  })

  it('shows error state when fetch fails', async () => {
    mockFetch
      .mockResolvedValueOnce(mockFiltersResponse())
      .mockResolvedValueOnce({ ok: false })

    render(<RecallList />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load recalls. Please try again.')).toBeInTheDocument()
    })
  })

  it('shows PARK IT badge in flags column', async () => {
    mockFetch
      .mockResolvedValueOnce(mockFiltersResponse())
      .mockResolvedValueOnce(mockRecallsResponse(mockRecalls, 2))

    render(<RecallList />)

    await waitFor(() => {
      expect(screen.getByText('PARK IT')).toBeInTheDocument()
    })
  })

  it('expands row on click to show details', async () => {
    const user = userEvent.setup()
    mockFetch
      .mockResolvedValueOnce(mockFiltersResponse())
      .mockResolvedValueOnce(mockRecallsResponse(mockRecalls, 2))

    render(<RecallList />)

    await waitFor(() => {
      expect(screen.getByText('24V-001')).toBeInTheDocument()
    })

    const rows = screen.getAllByTestId('recall-row')
    await user.click(rows[0])

    expect(screen.getByTestId('recall-detail')).toBeInTheDocument()
    // Summary appears both in the table row (hidden lg:table-cell) and in the detail panel
    expect(screen.getAllByText('Engine may stall').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Risk of crash')).toBeInTheDocument()
  })
})
