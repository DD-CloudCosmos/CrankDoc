import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DesktopSearch } from './DesktopSearch'

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

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

describe('DesktopSearch', () => {
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
