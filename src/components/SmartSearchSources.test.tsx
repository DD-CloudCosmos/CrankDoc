import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SmartSearchSources } from './SmartSearchSources'
import type { RagSource } from './SmartSearchSources'

const mockSources: RagSource[] = [
  {
    sectionTitle: 'Valve Clearance Adjustment',
    pageNumbers: [42, 43],
    contentType: 'service_manual',
    make: 'Honda',
    model: 'CBR600RR',
    similarity: 0.923,
  },
  {
    sectionTitle: 'Oil Change Procedure',
    pageNumbers: [15],
    contentType: 'maintenance_guide',
    make: 'Yamaha',
    model: 'MT-07',
    similarity: 0.871,
  },
  {
    sectionTitle: null,
    pageNumbers: null,
    contentType: 'technical_bulletin',
    make: null,
    model: null,
    similarity: 0.654,
  },
]

describe('SmartSearchSources', () => {
  it('renders the sources card with count', () => {
    render(<SmartSearchSources sources={mockSources} />)
    expect(screen.getByTestId('sources-card')).toBeInTheDocument()
    expect(screen.getByText('Sources (3)')).toBeInTheDocument()
  })

  it('shows section titles for each source', () => {
    render(<SmartSearchSources sources={mockSources} />)
    expect(screen.getByText('Valve Clearance Adjustment')).toBeInTheDocument()
    expect(screen.getByText('Oil Change Procedure')).toBeInTheDocument()
  })

  it('shows page numbers when present', () => {
    render(<SmartSearchSources sources={mockSources} />)
    expect(screen.getByText('p. 42, 43')).toBeInTheDocument()
    expect(screen.getByText('p. 15')).toBeInTheDocument()
  })

  it('shows similarity percentage rounded to nearest integer', () => {
    render(<SmartSearchSources sources={mockSources} />)
    expect(screen.getByText('92% match')).toBeInTheDocument()
    expect(screen.getByText('87% match')).toBeInTheDocument()
    expect(screen.getByText('65% match')).toBeInTheDocument()
  })

  it('shows content type badges', () => {
    render(<SmartSearchSources sources={mockSources} />)
    expect(screen.getByText('service_manual')).toBeInTheDocument()
    expect(screen.getByText('maintenance_guide')).toBeInTheDocument()
    expect(screen.getByText('technical_bulletin')).toBeInTheDocument()
  })

  it('handles null sectionTitle by showing "Untitled section"', () => {
    const sourcesWithNull: RagSource[] = [
      {
        sectionTitle: null,
        pageNumbers: [1],
        contentType: 'manual',
        make: null,
        model: null,
        similarity: 0.5,
      },
    ]
    render(<SmartSearchSources sources={sourcesWithNull} />)
    expect(screen.getByText('Untitled section')).toBeInTheDocument()
  })

  it('does not render page numbers when pageNumbers is null', () => {
    const sourcesNoPages: RagSource[] = [
      {
        sectionTitle: 'Test Section',
        pageNumbers: null,
        contentType: 'manual',
        make: null,
        model: null,
        similarity: 0.8,
      },
    ]
    render(<SmartSearchSources sources={sourcesNoPages} />)
    expect(screen.queryByText(/^p\./)).not.toBeInTheDocument()
  })

  it('does not render page numbers when pageNumbers is empty', () => {
    const sourcesEmptyPages: RagSource[] = [
      {
        sectionTitle: 'Test Section',
        pageNumbers: [],
        contentType: 'manual',
        make: null,
        model: null,
        similarity: 0.8,
      },
    ]
    render(<SmartSearchSources sources={sourcesEmptyPages} />)
    expect(screen.queryByText(/^p\./)).not.toBeInTheDocument()
  })

  it('shows make badge when make is present', () => {
    render(<SmartSearchSources sources={mockSources} />)
    expect(screen.getByText('Honda')).toBeInTheDocument()
    expect(screen.getByText('Yamaha')).toBeInTheDocument()
  })

  it('shows model badge when model is present', () => {
    render(<SmartSearchSources sources={mockSources} />)
    expect(screen.getByText('CBR600RR')).toBeInTheDocument()
    expect(screen.getByText('MT-07')).toBeInTheDocument()
  })

  it('renders an empty sources card without errors', () => {
    render(<SmartSearchSources sources={[]} />)
    expect(screen.getByText('Sources (0)')).toBeInTheDocument()
  })
})
