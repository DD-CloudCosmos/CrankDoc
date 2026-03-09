import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DesktopSearch } from './DesktopSearch'
import { useSearch } from '@/hooks/useSearch'

vi.mock('@/hooks/useSearch', () => ({
  useSearch: vi.fn(() => ({
    query: '',
    setQuery: vi.fn(),
    results: null,
    isLoading: false,
    error: null,
    status: 'idle',
    clear: vi.fn(),
  })),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

describe('DesktopSearch', () => {
  beforeEach(() => {
    vi.mocked(useSearch).mockReturnValue({
      query: '',
      setQuery: vi.fn(),
      results: null,
      isLoading: false,
      error: null,
      status: 'idle' as const,
      clear: vi.fn(),
    })
  })

  it('renders the search input', () => {
    render(<DesktopSearch />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('does not show results dropdown when query is empty', () => {
    render(<DesktopSearch />)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('has correct aria label', () => {
    render(<DesktopSearch />)
    expect(screen.getByLabelText('Search CrankDoc')).toBeInTheDocument()
  })
})

describe('DesktopSearch interactions', () => {
  const mockClear = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Override useSearch mock to return an open state (query >= 2 chars + results present)
    vi.mocked(useSearch).mockReturnValue({
      query: 'honda',
      setQuery: vi.fn(),
      results: { bikes: [], dtcCodes: [], glossaryTerms: [], diagnosticTrees: [], recalls: [] },
      isLoading: false,
      error: null,
      status: 'success' as const,
      clear: mockClear,
    })
  })

  it('closes dropdown on Escape key', () => {
    render(<DesktopSearch />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(mockClear).toHaveBeenCalled()
  })

  it('closes dropdown on click outside', () => {
    render(<DesktopSearch />)
    fireEvent.mouseDown(document)
    expect(mockClear).toHaveBeenCalled()
  })
})
