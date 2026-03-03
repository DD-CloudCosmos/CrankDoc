import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ManualCoverageMatrix } from './ManualCoverageMatrix'
import type { ModelCoverageRow, ManualCoverageCell } from '@/lib/manuals'

function makeCell(status: 'ingested' | 'local_only' | 'missing'): ManualCoverageCell {
  return { status, localFiles: [], documentSources: [] }
}

function makeRow(overrides: Partial<ModelCoverageRow> = {}): ModelCoverageRow {
  return {
    make: 'Honda',
    model: 'CBR600RR',
    motorcycleIds: ['1'],
    yearRange: '2003-2024',
    category: 'sport',
    coverage: {
      service_manual: makeCell('ingested'),
      owners_manual: makeCell('local_only'),
      parts_catalog: makeCell('missing'),
      tsb: makeCell('missing'),
    },
    totalDocs: 2,
    ...overrides,
  }
}

describe('ManualCoverageMatrix', () => {
  it('renders empty state when no rows', () => {
    render(<ManualCoverageMatrix rows={[]} />)
    expect(screen.getByText('No motorcycles found in the database.')).toBeInTheDocument()
  })

  it('renders model names', () => {
    const rows = [makeRow()]
    render(<ManualCoverageMatrix rows={rows} />)
    expect(screen.getAllByText('Honda CBR600RR').length).toBeGreaterThanOrEqual(1)
  })

  it('renders year range', () => {
    const rows = [makeRow()]
    render(<ManualCoverageMatrix rows={rows} />)
    expect(screen.getAllByText('2003-2024').length).toBeGreaterThanOrEqual(1)
  })

  it('renders category badge', () => {
    const rows = [makeRow()]
    render(<ManualCoverageMatrix rows={rows} />)
    expect(screen.getAllByText('sport').length).toBeGreaterThanOrEqual(1)
  })

  it('renders coverage indicators for each manual type', () => {
    const rows = [makeRow()]
    render(<ManualCoverageMatrix rows={rows} />)
    // One ingested + one local_only across desktop + mobile views
    expect(screen.getAllByText('Ingested').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Uploaded').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Missing').length).toBeGreaterThanOrEqual(1)
  })

  it('renders table headers for manual types', () => {
    const rows = [makeRow()]
    render(<ManualCoverageMatrix rows={rows} />)
    expect(screen.getByText('Service')).toBeInTheDocument()
    expect(screen.getByText("Owner's")).toBeInTheDocument()
    expect(screen.getByText('Parts')).toBeInTheDocument()
    expect(screen.getByText('TSB')).toBeInTheDocument()
  })

  it('renders multiple models', () => {
    const rows = [
      makeRow({ make: 'Honda', model: 'CBR600RR' }),
      makeRow({ make: 'BMW', model: 'R1250GS', category: 'adventure', yearRange: '2019+' }),
    ]
    render(<ManualCoverageMatrix rows={rows} />)
    expect(screen.getAllByText('Honda CBR600RR').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('BMW R1250GS').length).toBeGreaterThanOrEqual(1)
  })

  it('renders dash for null category', () => {
    const rows = [makeRow({ category: null })]
    render(<ManualCoverageMatrix rows={rows} />)
    // The em dash character should appear in at least one view
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1)
  })
})
