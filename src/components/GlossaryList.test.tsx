import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GlossaryList } from './GlossaryList'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function mockApiResponse(terms: unknown[], total: number, page = 1, totalPages = 1) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ terms, total, page, totalPages }),
  })
}

const mockTerms = [
  {
    id: '1',
    term: 'Carburetor',
    slug: 'carburetor',
    definition: 'A device that blends air and fuel.',
    category: 'Fuel',
    subcategory: null,
    aliases: ['carb'],
    related_terms: ['Fuel Injector'],
    illustration_url: null,
    applies_to: null,
    difficulty: 'intermediate',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    term: 'Spark Plug',
    slug: 'spark-plug',
    definition: 'Delivers electric current to the combustion chamber.',
    category: 'Engine',
    subcategory: null,
    aliases: null,
    related_terms: null,
    illustration_url: null,
    applies_to: null,
    difficulty: 'beginner',
    created_at: '2024-01-01T00:00:00Z',
  },
]

describe('GlossaryList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders terms after fetch', async () => {
    mockApiResponse(mockTerms, 2)

    render(<GlossaryList />)

    await waitFor(() => {
      expect(screen.getByText('Carburetor')).toBeInTheDocument()
    })
    expect(screen.getByText('Spark Plug')).toBeInTheDocument()
    expect(screen.getByText('Showing 2 of 2 terms')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {}))
    render(<GlossaryList />)
    expect(screen.getByText('Loading glossary terms...')).toBeInTheDocument()
  })

  it('shows error state when fetch fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })

    render(<GlossaryList />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load glossary terms. Please try again.')).toBeInTheDocument()
    })
  })

  it('shows empty state when no terms match', async () => {
    mockApiResponse([], 0)

    render(<GlossaryList />)

    await waitFor(() => {
      expect(screen.getByText('No terms found')).toBeInTheDocument()
    })
  })

  it('shows pagination controls when multiple pages exist', async () => {
    mockApiResponse(mockTerms, 90, 1, 3)

    render(<GlossaryList />)

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    })
    expect(screen.getByText('Previous')).toBeDisabled()
    expect(screen.getByText('Next')).toBeEnabled()
  })

  it('navigates to next page on Next click', async () => {
    const user = userEvent.setup()
    mockApiResponse(mockTerms, 90, 1, 3)

    render(<GlossaryList />)

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    })

    mockApiResponse(mockTerms, 90, 2, 3)
    await user.click(screen.getByText('Next'))

    await waitFor(() => {
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
    })
  })

  it('fetches with q param after typing in search', async () => {
    const user = userEvent.setup()
    mockApiResponse(mockTerms, 2)

    render(<GlossaryList />)

    await waitFor(() => {
      expect(screen.getByText('Carburetor')).toBeInTheDocument()
    })

    mockApiResponse([], 0)
    await user.type(screen.getByPlaceholderText(/search motorcycle terms/i), 'carb')

    await waitFor(() => {
      const calls = mockFetch.mock.calls
      const hasSearchCall = calls.some((call: unknown[]) =>
        typeof call[0] === 'string' && call[0].includes('q=carb')
      )
      expect(hasSearchCall).toBe(true)
    }, { timeout: 2000 })
  })

  it('fetches with category param when category filter is clicked', async () => {
    const user = userEvent.setup()
    mockApiResponse(mockTerms, 2)

    render(<GlossaryList />)

    await waitFor(() => {
      expect(screen.getByText('Carburetor')).toBeInTheDocument()
    })

    mockApiResponse([], 0)
    // Click the "Engine" category button — find it in the filter area (not the badge)
    const engineButtons = screen.getAllByText('Engine')
    const filterButton = engineButtons.find((el) => el.closest('button') && !el.closest('[class*="badge"]'))
    expect(filterButton).toBeDefined()

    await user.click(filterButton!)

    await waitFor(() => {
      const calls = mockFetch.mock.calls
      const hasCatCall = calls.some((call: unknown[]) =>
        typeof call[0] === 'string' && call[0].includes('category=Engine')
      )
      expect(hasCatCall).toBe(true)
    }, { timeout: 2000 })
  })

  it('fetches with letter param when letter filter is clicked', async () => {
    const user = userEvent.setup()
    mockApiResponse(mockTerms, 2)

    render(<GlossaryList />)

    await waitFor(() => {
      expect(screen.getByText('Carburetor')).toBeInTheDocument()
    })

    mockApiResponse([], 0)
    await user.click(screen.getByText('M'))

    await waitFor(() => {
      const calls = mockFetch.mock.calls
      const hasLetterCall = calls.some((call: unknown[]) =>
        typeof call[0] === 'string' && call[0].includes('letter=M')
      )
      expect(hasLetterCall).toBe(true)
    }, { timeout: 2000 })
  })

  it('clears letter when searching', async () => {
    const user = userEvent.setup()
    mockApiResponse(mockTerms, 2)

    render(<GlossaryList />)

    await waitFor(() => {
      expect(screen.getByText('Carburetor')).toBeInTheDocument()
    })

    // Click a letter first
    mockApiResponse(mockTerms, 1)
    await user.click(screen.getByText('C'))

    await waitFor(() => {
      const calls = mockFetch.mock.calls
      const hasLetterCall = calls.some((call: unknown[]) =>
        typeof call[0] === 'string' && call[0].includes('letter=C')
      )
      expect(hasLetterCall).toBe(true)
    }, { timeout: 2000 })

    // Now type in search — letter should be cleared
    mockApiResponse(mockTerms, 1)
    await user.type(screen.getByPlaceholderText(/search motorcycle terms/i), 'test')

    await waitFor(() => {
      const calls = mockFetch.mock.calls
      const lastCall = calls[calls.length - 1]
      const url = typeof lastCall[0] === 'string' ? lastCall[0] : ''
      expect(url).toContain('q=test')
      expect(url).not.toContain('letter=')
    }, { timeout: 2000 })
  })

  it('clears search when letter is clicked', async () => {
    const user = userEvent.setup()
    mockApiResponse(mockTerms, 2)

    render(<GlossaryList />)

    await waitFor(() => {
      expect(screen.getByText('Carburetor')).toBeInTheDocument()
    })

    // Type a search query first
    mockApiResponse(mockTerms, 1)
    await user.type(screen.getByPlaceholderText(/search motorcycle terms/i), 'carb')

    await waitFor(() => {
      const calls = mockFetch.mock.calls
      const hasSearchCall = calls.some((call: unknown[]) =>
        typeof call[0] === 'string' && call[0].includes('q=carb')
      )
      expect(hasSearchCall).toBe(true)
    }, { timeout: 2000 })

    // Click a letter — search state should be cleared
    mockApiResponse(mockTerms, 1)
    await user.click(screen.getByText('B'))

    await waitFor(() => {
      const calls = mockFetch.mock.calls
      const lastCall = calls[calls.length - 1]
      const url = typeof lastCall[0] === 'string' ? lastCall[0] : ''
      expect(url).toContain('letter=B')
      expect(url).not.toContain('q=')
    }, { timeout: 2000 })
  })
})
