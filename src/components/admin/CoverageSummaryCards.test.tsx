import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CoverageSummaryCards } from './CoverageSummaryCards'
import type { CoverageSummary } from '@/lib/manuals'

describe('CoverageSummaryCards', () => {
  const defaultSummary: CoverageSummary = {
    modelsWithManuals: 5,
    totalModels: 12,
    totalDocumentSources: 8,
    localPdfCount: 15,
    overallCoveragePercent: 42,
  }

  it('renders models covered count', () => {
    render(<CoverageSummaryCards summary={defaultSummary} />)
    expect(screen.getByText('5 / 12')).toBeInTheDocument()
    expect(screen.getByText('Models Covered')).toBeInTheDocument()
  })

  it('renders documents ingested count', () => {
    render(<CoverageSummaryCards summary={defaultSummary} />)
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('Documents Ingested')).toBeInTheDocument()
  })

  it('renders local PDF count', () => {
    render(<CoverageSummaryCards summary={defaultSummary} />)
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('Local PDFs')).toBeInTheDocument()
  })

  it('renders coverage score as percentage', () => {
    render(<CoverageSummaryCards summary={defaultSummary} />)
    expect(screen.getByText('42%')).toBeInTheDocument()
    expect(screen.getByText('Coverage Score')).toBeInTheDocument()
  })

  it('renders N/A for local PDFs when null (production)', () => {
    const summary = { ...defaultSummary, localPdfCount: null }
    render(<CoverageSummaryCards summary={summary} />)
    expect(screen.getByText('N/A')).toBeInTheDocument()
    expect(screen.getByText('not available in production')).toBeInTheDocument()
  })

  it('renders all four stat cards', () => {
    render(<CoverageSummaryCards summary={defaultSummary} />)
    expect(screen.getByText('Models Covered')).toBeInTheDocument()
    expect(screen.getByText('Documents Ingested')).toBeInTheDocument()
    expect(screen.getByText('Local PDFs')).toBeInTheDocument()
    expect(screen.getByText('Coverage Score')).toBeInTheDocument()
  })
})
