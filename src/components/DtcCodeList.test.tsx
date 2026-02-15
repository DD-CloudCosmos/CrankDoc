import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DtcCodeList } from './DtcCodeList'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function mockApiResponse(codes: unknown[], total: number, page = 1, totalPages = 1) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ codes, total, page, totalPages }),
  })
}

const mockCodes = [
  {
    id: '1',
    code: 'P0301',
    description: 'Cylinder 1 Misfire Detected',
    category: 'powertrain',
    subcategory: 'ignition',
    severity: 'high',
    common_causes: ['Faulty spark plug'],
    applies_to_makes: null,
    manufacturer: 'Honda',
    system: 'Engine Management',
    diagnostic_method: 'OBD-II scanner',
    fix_reference: 'Replace spark plug',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    code: 'C1234',
    description: 'ABS Wheel Speed Sensor',
    category: 'chassis',
    subcategory: 'abs',
    severity: 'medium',
    common_causes: ['Faulty sensor'],
    applies_to_makes: null,
    manufacturer: 'BMW',
    system: 'ABS',
    diagnostic_method: 'BMW GS-911',
    fix_reference: null,
    created_at: '2024-01-01T00:00:00Z',
  },
]

describe('DtcCodeList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders codes fetched from API', async () => {
    mockApiResponse(mockCodes, 2)

    render(<DtcCodeList />)

    await waitFor(() => {
      expect(screen.getByText('P0301')).toBeInTheDocument()
    })
    expect(screen.getByText('C1234')).toBeInTheDocument()
    expect(screen.getByText('Showing 2 of 2 codes')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {}))
    render(<DtcCodeList />)
    expect(screen.getByText('Loading DTC codes...')).toBeInTheDocument()
  })

  it('shows error state when fetch fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })

    render(<DtcCodeList />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load DTC codes. Please try again.')).toBeInTheDocument()
    })
  })

  it('shows empty state when no codes match', async () => {
    mockApiResponse([], 0)

    render(<DtcCodeList />)

    await waitFor(() => {
      expect(screen.getByText('No DTC codes available')).toBeInTheDocument()
    })
  })

  it('shows pagination controls when multiple pages exist', async () => {
    mockApiResponse(mockCodes, 45, 1, 3)

    render(<DtcCodeList />)

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    })
    expect(screen.getByText('Previous')).toBeDisabled()
    expect(screen.getByText('Next')).toBeEnabled()
  })

  it('navigates to next page on Next click', async () => {
    const user = userEvent.setup()
    mockApiResponse(mockCodes, 45, 1, 3)

    render(<DtcCodeList />)

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    })

    // Mock for page 2
    mockApiResponse(mockCodes, 45, 2, 3)
    await user.click(screen.getByText('Next'))

    await waitFor(() => {
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
    })
  })

  it('renders category filter tabs', async () => {
    mockApiResponse(mockCodes, 2)

    render(<DtcCodeList />)

    await waitFor(() => {
      expect(screen.getByText('Powertrain (P)')).toBeInTheDocument()
    })
    expect(screen.getByText('Chassis (C)')).toBeInTheDocument()
  })

  it('renders manufacturer filter pills', async () => {
    mockApiResponse(mockCodes, 2)

    render(<DtcCodeList />)

    await waitFor(() => {
      expect(screen.getByText('Manufacturer')).toBeInTheDocument()
    })
    expect(screen.getByText('Harley-Davidson')).toBeInTheDocument()
    // BMW and Honda appear both as filter buttons and in card badges, so use getAllByText
    expect(screen.getAllByText('BMW').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Honda').length).toBeGreaterThanOrEqual(1)
  })

  it('fetches with manufacturer parameter when manufacturer filter is clicked', async () => {
    const user = userEvent.setup()

    mockApiResponse(mockCodes, 2)
    render(<DtcCodeList />)

    await waitFor(() => {
      expect(screen.getByText('P0301')).toBeInTheDocument()
    })

    // Find the BMW filter button (not the badge on the card)
    // The filter button is inside the manufacturer filter section
    const bmwElements = screen.getAllByText('BMW')
    const bmwButton = bmwElements.find((el) => el.closest('button'))
    expect(bmwButton).toBeDefined()

    mockApiResponse(mockCodes, 1)
    await user.click(bmwButton!)

    await waitFor(() => {
      const calls = mockFetch.mock.calls
      const hasMfrCall = calls.some((call: unknown[]) =>
        typeof call[0] === 'string' && call[0].includes('manufacturer=BMW')
      )
      expect(hasMfrCall).toBe(true)
    }, { timeout: 2000 })
  })

  it('fetches with search parameter after typing', async () => {
    const user = userEvent.setup()

    mockApiResponse(mockCodes, 2)
    render(<DtcCodeList />)

    await waitFor(() => {
      expect(screen.getByText('P0301')).toBeInTheDocument()
    })

    // Type search query - the debounce will fire after 300ms
    mockApiResponse([], 0)
    await user.type(screen.getByPlaceholderText(/search dtc codes/i), 'misfire')

    // Wait for debounce and fetch to complete
    await waitFor(() => {
      const calls = mockFetch.mock.calls
      const hasSearchCall = calls.some((call: unknown[]) =>
        typeof call[0] === 'string' && call[0].includes('q=misfire')
      )
      expect(hasSearchCall).toBe(true)
    }, { timeout: 2000 })
  })
})
