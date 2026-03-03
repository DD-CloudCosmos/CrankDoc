import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ModelCoverageRow, CoverageSummary, ManualCoverageCell } from '@/lib/manuals'

// Mock the manuals modules
const mockFetchMotorcycles = vi.fn()
const mockFetchDocumentSources = vi.fn()
const mockScanLocalManuals = vi.fn()
const mockBuildCoverageMatrix = vi.fn()

vi.mock('@/lib/manuals', () => ({
  buildCoverageMatrix: (...args: unknown[]) => mockBuildCoverageMatrix(...args),
  MANUAL_TYPES: ['service_manual', 'owners_manual', 'parts_catalog', 'tsb'],
  MANUAL_TYPE_LABELS: {
    service_manual: 'Service',
    owners_manual: "Owner's",
    parts_catalog: 'Parts',
    tsb: 'TSB',
  },
}))

vi.mock('@/lib/manuals.server', () => ({
  fetchMotorcycles: (...args: unknown[]) => mockFetchMotorcycles(...args),
  fetchDocumentSources: (...args: unknown[]) => mockFetchDocumentSources(...args),
  scanLocalManuals: (...args: unknown[]) => mockScanLocalManuals(...args),
}))

function makeCell(status: 'ingested' | 'local_only' | 'missing'): ManualCoverageCell {
  return { status, localFiles: [], documentSources: [] }
}

describe('AdminManualsPage', () => {
  const mockRows: ModelCoverageRow[] = [
    {
      make: 'Honda',
      model: 'CBR600RR',
      motorcycleIds: ['1'],
      yearRange: '2003-2024',
      category: 'sport',
      coverage: {
        service_manual: {
          status: 'ingested',
          localFiles: [],
          documentSources: [{ id: 'ds-1', title: 'Honda Service Manual', processing_status: 'completed' }],
        },
        owners_manual: makeCell('local_only'),
        parts_catalog: makeCell('missing'),
        tsb: makeCell('missing'),
      },
      totalDocs: 2,
    },
    {
      make: 'Kymco',
      model: 'AK 550i',
      motorcycleIds: ['2'],
      yearRange: '2017+',
      category: 'scooter',
      coverage: {
        service_manual: makeCell('missing'),
        owners_manual: makeCell('missing'),
        parts_catalog: makeCell('missing'),
        tsb: makeCell('missing'),
      },
      totalDocs: 0,
    },
  ]

  const mockSummary: CoverageSummary = {
    modelsWithManuals: 1,
    totalModels: 2,
    totalDocumentSources: 1,
    localPdfCount: 2,
    overallCoveragePercent: 25,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchMotorcycles.mockResolvedValue([])
    mockFetchDocumentSources.mockResolvedValue([])
    mockScanLocalManuals.mockResolvedValue([])
    mockBuildCoverageMatrix.mockReturnValue({ rows: mockRows, summary: mockSummary })
  })

  // Dynamic import of page to ensure mocks are in place
  async function renderPage() {
    const { default: AdminManualsPage } = await import('./page')
    render(await AdminManualsPage())
  }

  it('renders the page title', async () => {
    await renderPage()
    expect(screen.getByRole('heading', { name: /manual coverage/i, level: 1 })).toBeInTheDocument()
  })

  it('renders summary cards with data', async () => {
    await renderPage()
    expect(screen.getByText('Models Covered')).toBeInTheDocument()
    expect(screen.getByText('Documents Ingested')).toBeInTheDocument()
    expect(screen.getByText('Coverage Score')).toBeInTheDocument()
  })

  it('renders models covered stat', async () => {
    await renderPage()
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
  })

  it('renders motorcycles in the coverage matrix', async () => {
    await renderPage()
    expect(screen.getAllByText(/Honda CBR600RR/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Kymco AK 550i/i).length).toBeGreaterThanOrEqual(1)
  })

  it('renders error state when data fetch fails', async () => {
    mockFetchMotorcycles.mockRejectedValue(new Error('Failed to fetch motorcycles'))

    await renderPage()

    expect(screen.getByText(/error loading coverage data/i)).toBeInTheDocument()
    expect(screen.getByText(/failed to fetch motorcycles/i)).toBeInTheDocument()
  })

  it('shows coverage indicators for ingested documents', async () => {
    await renderPage()
    // Honda has a service_manual ingested
    expect(screen.getAllByText('Ingested').length).toBeGreaterThanOrEqual(1)
  })

  it('renders description text', async () => {
    await renderPage()
    expect(screen.getByText(/track which models have service manuals/i)).toBeInTheDocument()
  })
})
