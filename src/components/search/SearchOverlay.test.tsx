import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SearchOverlay } from './SearchOverlay'

// Mock the useSearch hook
vi.mock('@/hooks/useSearch', () => ({
  useSearch: () => ({
    query: '',
    setQuery: vi.fn(),
    results: null,
    isLoading: false,
    error: null,
    status: 'idle',
    clear: vi.fn(),
  }),
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
})
