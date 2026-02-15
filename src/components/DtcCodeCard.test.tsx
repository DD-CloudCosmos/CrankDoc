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
    severity: null,
    common_causes: ['Faulty spark plug', 'Ignition coil failure'],
    applies_to_makes: null,
    manufacturer: null,
    system: null,
    diagnostic_method: null,
    fix_reference: null,
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

  it('handles null common_causes', () => {
    const codeNoCauses = { ...mockCode, common_causes: null }
    render(<DtcCodeCard dtcCode={codeNoCauses} />)
    expect(screen.getByText('P0301')).toBeInTheDocument()
  })

  it('handles null category', () => {
    const codeNoCategory = { ...mockCode, category: null }
    render(<DtcCodeCard dtcCode={codeNoCategory} />)
    expect(screen.getByText('P0301')).toBeInTheDocument()
  })
})
