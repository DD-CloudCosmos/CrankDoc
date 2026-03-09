import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SearchResults } from './SearchResults'
import type { SearchResponse } from '@/types/search.types'

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

const emptyResults: SearchResponse = {
  bikes: [],
  dtcCodes: [],
  glossaryTerms: [],
  diagnosticTrees: [],
  recalls: [],
}

const populatedResults: SearchResponse = {
  bikes: [
    { id: '1', title: 'Honda CBR600RR', subtitle: '2003-2006', href: '/bikes/1', category: 'bikes' },
  ],
  dtcCodes: [
    { id: '2', title: 'P0301', subtitle: 'Cylinder misfire', href: '/dtc?q=P0301', category: 'dtcCodes' },
  ],
  glossaryTerms: [],
  diagnosticTrees: [
    { id: '3', title: 'Engine No Start', subtitle: 'Guide', href: '/diagnose?tree=3', category: 'diagnosticTrees' },
  ],
  recalls: [],
}

describe('SearchResults', () => {
  it('renders nothing when no query', () => {
    const { container } = render(
      <SearchResults results={null} isLoading={false} hasQuery={false} id="results" />
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows loading state', () => {
    render(
      <SearchResults results={null} isLoading={true} hasQuery={true} id="results" />
    )
    expect(screen.getByText('Searching...')).toBeInTheDocument()
  })

  it('shows "No results" when query exists but no results', () => {
    render(
      <SearchResults results={emptyResults} isLoading={false} hasQuery={true} id="results" />
    )
    expect(screen.getByText('No results found')).toBeInTheDocument()
  })

  it('renders grouped results with category headers', () => {
    render(
      <SearchResults results={populatedResults} isLoading={false} hasQuery={true} id="results" />
    )

    // Category headers
    expect(screen.getByText('Bikes')).toBeInTheDocument()
    expect(screen.getByText('DTC Codes')).toBeInTheDocument()
    expect(screen.getByText('Diagnostic Guides')).toBeInTheDocument()

    // Individual results
    expect(screen.getByText('Honda CBR600RR')).toBeInTheDocument()
    expect(screen.getByText('P0301')).toBeInTheDocument()
    expect(screen.getByText('Engine No Start')).toBeInTheDocument()
  })

  it('does not render empty categories', () => {
    render(
      <SearchResults results={populatedResults} isLoading={false} hasQuery={true} id="results" />
    )

    // These categories have no results
    expect(screen.queryByText('Glossary')).not.toBeInTheDocument()
    expect(screen.queryByText('Recalls')).not.toBeInTheDocument()
  })

  it('has correct ARIA attributes', () => {
    render(
      <SearchResults results={populatedResults} isLoading={false} hasQuery={true} id="search-results" />
    )
    const listbox = screen.getByRole('listbox')
    expect(listbox).toHaveAttribute('id', 'search-results')
    expect(listbox).toHaveAttribute('aria-label', 'Search results')
  })
})
