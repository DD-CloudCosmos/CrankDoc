import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CoverageSummaryCards } from './CoverageSummaryCards'
import type { CoverageSummary } from '@/lib/manuals'

describe('CoverageSummaryCards', () => {
  const defaultSummary: CoverageSummary = {
    modelsWithManuals: 5,
    totalModels: 12,
    totalDocumentSources: 8,
    storagePdfCount: 15,
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

  it('renders storage PDF count', () => {
    render(<CoverageSummaryCards summary={defaultSummary} />)
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('Storage PDFs')).toBeInTheDocument()
  })

  it('renders coverage score as percentage', () => {
    render(<CoverageSummaryCards summary={defaultSummary} />)
    expect(screen.getByText('42%')).toBeInTheDocument()
    expect(screen.getByText('Coverage Score')).toBeInTheDocument()
  })

  it('renders N/A for storage PDFs when null', () => {
    const summary = { ...defaultSummary, storagePdfCount: null }
    render(<CoverageSummaryCards summary={summary} />)
    expect(screen.getByText('N/A')).toBeInTheDocument()
    expect(screen.getByText('not available')).toBeInTheDocument()
  })

  it('renders all four stat cards', () => {
    render(<CoverageSummaryCards summary={defaultSummary} />)
    expect(screen.getByText('Models Covered')).toBeInTheDocument()
    expect(screen.getByText('Documents Ingested')).toBeInTheDocument()
    expect(screen.getByText('Storage PDFs')).toBeInTheDocument()
    expect(screen.getByText('Coverage Score')).toBeInTheDocument()
  })
})
