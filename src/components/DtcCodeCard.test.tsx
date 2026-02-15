import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DtcCodeCard } from './DtcCodeCard'
import type { DtcCode } from '@/types/database.types'

describe('DtcCodeCard', () => {
  const mockCode: DtcCode = {
    id: '1',
    code: 'P0301',
    description: 'Cylinder 1 Misfire Detected',
    category: 'powertrain',
    subcategory: null,
    severity: 'high',
    common_causes: ['Faulty spark plug', 'Ignition coil failure'],
    applies_to_makes: null,
    manufacturer: 'Honda',
    system: 'Engine Management',
    diagnostic_method: 'OBD-II scanner',
    fix_reference: 'Replace spark plug and check ignition coil resistance',
    created_at: '2024-01-01T00:00:00Z',
  }

  it('renders the DTC code', () => {
    render(<DtcCodeCard dtcCode={mockCode} />)
    expect(screen.getByText('P0301')).toBeInTheDocument()
  })

  it('renders the description', () => {
    render(<DtcCodeCard dtcCode={mockCode} />)
    expect(screen.getByText('Cylinder 1 Misfire Detected')).toBeInTheDocument()
  })

  it('renders common causes', () => {
    render(<DtcCodeCard dtcCode={mockCode} />)
    expect(screen.getByText('Faulty spark plug')).toBeInTheDocument()
    expect(screen.getByText('Ignition coil failure')).toBeInTheDocument()
  })

  it('renders the category badge', () => {
    render(<DtcCodeCard dtcCode={mockCode} />)
    expect(screen.getByText(/powertrain/i)).toBeInTheDocument()
  })

  it('renders the manufacturer badge', () => {
    render(<DtcCodeCard dtcCode={mockCode} />)
    expect(screen.getByText('Honda')).toBeInTheDocument()
  })

  it('renders the severity indicator with correct label', () => {
    render(<DtcCodeCard dtcCode={mockCode} />)
    expect(screen.getByText('High')).toBeInTheDocument()
  })

  it('renders severity low with green label', () => {
    const lowCode = { ...mockCode, severity: 'low' as const }
    render(<DtcCodeCard dtcCode={lowCode} />)
    expect(screen.getByText('Low')).toBeInTheDocument()
  })

  it('renders severity critical with red label', () => {
    const criticalCode = { ...mockCode, severity: 'critical' as const }
    render(<DtcCodeCard dtcCode={criticalCode} />)
    expect(screen.getByText('Critical')).toBeInTheDocument()
  })

  it('renders the system field', () => {
    render(<DtcCodeCard dtcCode={mockCode} />)
    expect(screen.getByText('Engine Management')).toBeInTheDocument()
    expect(screen.getByText('System:')).toBeInTheDocument()
  })

  it('renders the diagnostic method', () => {
    render(<DtcCodeCard dtcCode={mockCode} />)
    expect(screen.getByText('OBD-II scanner')).toBeInTheDocument()
    expect(screen.getByText('Read with:')).toBeInTheDocument()
  })

  it('renders the fix reference', () => {
    render(<DtcCodeCard dtcCode={mockCode} />)
    expect(screen.getByText('Replace spark plug and check ignition coil resistance')).toBeInTheDocument()
    expect(screen.getByText('Fix Reference')).toBeInTheDocument()
  })

  it('handles null common_causes', () => {
    const codeNoCauses = { ...mockCode, common_causes: null }
    render(<DtcCodeCard dtcCode={codeNoCauses} />)
    expect(screen.getByText('P0301')).toBeInTheDocument()
    expect(screen.queryByText('Common Causes')).not.toBeInTheDocument()
  })

  it('handles null category', () => {
    const codeNoCategory = { ...mockCode, category: null }
    render(<DtcCodeCard dtcCode={codeNoCategory} />)
    expect(screen.getByText('P0301')).toBeInTheDocument()
  })

  it('handles null manufacturer', () => {
    const codeNoMfr = { ...mockCode, manufacturer: null }
    render(<DtcCodeCard dtcCode={codeNoMfr} />)
    expect(screen.getByText('P0301')).toBeInTheDocument()
    expect(screen.queryByText('Honda')).not.toBeInTheDocument()
  })

  it('handles null severity', () => {
    const codeNoSeverity = { ...mockCode, severity: null }
    render(<DtcCodeCard dtcCode={codeNoSeverity} />)
    expect(screen.getByText('P0301')).toBeInTheDocument()
    expect(screen.queryByText('High')).not.toBeInTheDocument()
    expect(screen.queryByText('Low')).not.toBeInTheDocument()
  })

  it('handles null system', () => {
    const codeNoSystem = { ...mockCode, system: null }
    render(<DtcCodeCard dtcCode={codeNoSystem} />)
    expect(screen.getByText('P0301')).toBeInTheDocument()
    expect(screen.queryByText('System:')).not.toBeInTheDocument()
  })

  it('handles null diagnostic_method', () => {
    const codeNoDiag = { ...mockCode, diagnostic_method: null }
    render(<DtcCodeCard dtcCode={codeNoDiag} />)
    expect(screen.getByText('P0301')).toBeInTheDocument()
    expect(screen.queryByText('Read with:')).not.toBeInTheDocument()
  })

  it('handles null fix_reference', () => {
    const codeNoFix = { ...mockCode, fix_reference: null }
    render(<DtcCodeCard dtcCode={codeNoFix} />)
    expect(screen.getByText('P0301')).toBeInTheDocument()
    expect(screen.queryByText('Fix Reference')).not.toBeInTheDocument()
  })
})
