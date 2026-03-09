import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
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
    aliases: ['carb', 'carburettor'],
    related_terms: ['Fuel Injector'],
    illustration_url: '/illustrations/carburetor.svg',
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

  it('renders terms in a table after fetch', async () => {
    mockApiResponse(mockTerms, 2)

    render(<GlossaryList />)

    await waitFor(() => {
      expect(screen.getByText('Carburetor')).toBeInTheDocument()
    })
    expect(screen.getByText('Spark Plug')).toBeInTheDocument()
    expect(screen.getByText('Showing 2 of 2 terms')).toBeInTheDocument()
    expect(screen.getAllByTestId('glossary-row')).toHaveLength(2)
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
    const engineButtons = screen.getAllByText('Engine')
    const filterButton = engineButtons.find((el) => el.closest('button') && !el.closest('table'))
    expect(filterButton).toBeDefined()

    await user.click(filterButton!)

    await waitFor(() => {
      const calls = mockFetch.mock.calls
      const hasCatCall = calls.some((call: unknown[]) =>
        typeof call[0] === 'string' && call[0].includes('category=engine')
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

    mockApiResponse(mockTerms, 1)
    await user.click(screen.getByText('C'))

    await waitFor(() => {
      const calls = mockFetch.mock.calls
      const hasLetterCall = calls.some((call: unknown[]) =>
        typeof call[0] === 'string' && call[0].includes('letter=C')
      )
      expect(hasLetterCall).toBe(true)
    }, { timeout: 2000 })

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

    mockApiResponse(mockTerms, 1)
    await user.type(screen.getByPlaceholderText(/search motorcycle terms/i), 'carb')

    await waitFor(() => {
      const calls = mockFetch.mock.calls
      const hasSearchCall = calls.some((call: unknown[]) =>
        typeof call[0] === 'string' && call[0].includes('q=carb')
      )
      expect(hasSearchCall).toBe(true)
    }, { timeout: 2000 })

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

  it('expands row on click to show details', async () => {
    const user = userEvent.setup()
    mockApiResponse(mockTerms, 2)

    render(<GlossaryList />)

    await waitFor(() => {
      expect(screen.getByText('Carburetor')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('glossary-detail')).not.toBeInTheDocument()

    const rows = screen.getAllByTestId('glossary-row')
    await user.click(rows[0])

    const detail = screen.getByTestId('glossary-detail')
    expect(detail).toBeInTheDocument()
    expect(within(detail).getByText('A device that blends air and fuel.')).toBeInTheDocument()
    expect(within(detail).getByText('Also known as: carb, carburettor')).toBeInTheDocument()
    expect(within(detail).getByText('See also:')).toBeInTheDocument()
    expect(within(detail).getByText('Fuel Injector')).toBeInTheDocument()
  })

  it('collapses row when clicked again', async () => {
    const user = userEvent.setup()
    mockApiResponse(mockTerms, 2)

    render(<GlossaryList />)

    await waitFor(() => {
      expect(screen.getByText('Carburetor')).toBeInTheDocument()
    })

    const rows = screen.getAllByTestId('glossary-row')

    // Expand
    await user.click(rows[0])
    expect(screen.getByTestId('glossary-detail')).toBeInTheDocument()

    // Collapse
    await user.click(rows[0])
    expect(screen.queryByTestId('glossary-detail')).not.toBeInTheDocument()
  })

  it('shows illustration in expanded row when illustration_url is set', async () => {
    const user = userEvent.setup()
    mockApiResponse(mockTerms, 2)

    render(<GlossaryList />)

    await waitFor(() => {
      expect(screen.getByText('Carburetor')).toBeInTheDocument()
    })

    const rows = screen.getAllByTestId('glossary-row')
    await user.click(rows[0])

    const detail = screen.getByTestId('glossary-detail')
    const img = within(detail).getByAltText('Carburetor')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', '/illustrations/carburetor.svg')
  })

  it('does not show illustration for terms without illustration_url', async () => {
    const user = userEvent.setup()
    mockApiResponse(mockTerms, 2)

    render(<GlossaryList />)

    await waitFor(() => {
      expect(screen.getByText('Spark Plug')).toBeInTheDocument()
    })

    const rows = screen.getAllByTestId('glossary-row')
    await user.click(rows[1])

    const detail = screen.getByTestId('glossary-detail')
    expect(within(detail).queryByRole('img')).not.toBeInTheDocument()
  })

  it('has aria-expanded attribute on expandable rows', async () => {
    const user = userEvent.setup()
    mockApiResponse(mockTerms, 2)

    render(<GlossaryList />)

    await waitFor(() => {
      expect(screen.getByText('Carburetor')).toBeInTheDocument()
    })

    const rows = screen.getAllByTestId('glossary-row')
    expect(rows[0]).toHaveAttribute('aria-expanded', 'false')

    await user.click(rows[0])
    expect(rows[0]).toHaveAttribute('aria-expanded', 'true')

    await user.click(rows[0])
    expect(rows[0]).toHaveAttribute('aria-expanded', 'false')
  })

  it('expands row on Enter key press', async () => {
    const user = userEvent.setup()
    mockApiResponse(mockTerms, 2)

    render(<GlossaryList />)

    await waitFor(() => {
      expect(screen.getByText('Carburetor')).toBeInTheDocument()
    })

    const rows = screen.getAllByTestId('glossary-row')
    rows[0].focus()
    await user.keyboard('{Enter}')

    expect(screen.getByTestId('glossary-detail')).toBeInTheDocument()
  })

  it('expands row on Space key press', async () => {
    const user = userEvent.setup()
    mockApiResponse(mockTerms, 2)

    render(<GlossaryList />)

    await waitFor(() => {
      expect(screen.getByText('Carburetor')).toBeInTheDocument()
    })

    const rows = screen.getAllByTestId('glossary-row')
    rows[0].focus()
    await user.keyboard(' ')

    expect(screen.getByTestId('glossary-detail')).toBeInTheDocument()
  })

  it('has aria-live on loading state', () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {}))
    render(<GlossaryList />)
    const loadingEl = screen.getByText('Loading glossary terms...').closest('div')
    expect(loadingEl).toHaveAttribute('aria-live', 'polite')
  })

  it('shows category and difficulty badges in expanded row', async () => {
    const user = userEvent.setup()
    mockApiResponse(mockTerms, 2)

    render(<GlossaryList />)

    await waitFor(() => {
      expect(screen.getByText('Carburetor')).toBeInTheDocument()
    })

    const rows = screen.getAllByTestId('glossary-row')
    await user.click(rows[0])

    const detail = screen.getByTestId('glossary-detail')
    expect(within(detail).getByText('Fuel')).toBeInTheDocument()
    expect(within(detail).getByText('Intermediate')).toBeInTheDocument()
  })
})
