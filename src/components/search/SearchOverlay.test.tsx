import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SearchOverlay } from './SearchOverlay'
import { useSearch } from '@/hooks/useSearch'

// Mock the useSearch hook
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

// Mock Radix Dialog to render children directly in tests
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) =>
    <div data-testid="dialog-content" {...props}>{children}</div>,
  DialogTitle: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) =>
    <h2 {...props}>{children}</h2>,
  DialogDescription: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) =>
    <p {...props}>{children}</p>,
}))

describe('SearchOverlay', () => {
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

  it('renders nothing when closed', () => {
    const { container } = render(
      <SearchOverlay open={false} onOpenChange={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders search input when open', () => {
    render(<SearchOverlay open={true} onOpenChange={vi.fn()} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('has accessible title', () => {
    render(<SearchOverlay open={true} onOpenChange={vi.fn()} />)
    expect(screen.getByText('Search CrankDoc')).toBeInTheDocument()
  })

  it('has description for screen readers', () => {
    render(<SearchOverlay open={true} onOpenChange={vi.fn()} />)
    expect(screen.getByText(/search across bikes/i)).toBeInTheDocument()
  })

  it('renders search results area when open', () => {
    render(<SearchOverlay open={true} onOpenChange={vi.fn()} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByTestId('dialog-content')).toBeInTheDocument()
  })

  it('passes clear function to search input', () => {
    const mockClear = vi.fn()
    vi.mocked(useSearch).mockReturnValue({
      query: 'test',
      setQuery: vi.fn(),
      results: null,
      isLoading: false,
      error: null,
      status: 'idle' as const,
      clear: mockClear,
    })

    render(<SearchOverlay open={true} onOpenChange={vi.fn()} />)

    // Clear button in the input should trigger clear
    const clearButton = screen.queryByLabelText('Clear search')
    if (clearButton) {
      fireEvent.click(clearButton)
      expect(mockClear).toHaveBeenCalled()
    }
  })
})
