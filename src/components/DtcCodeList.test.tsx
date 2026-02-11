import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DtcCodeList } from './DtcCodeList'
import type { DtcCode } from '@/types/database.types'

const mockCodes: DtcCode[] = [
  {
    id: '1',
    code: 'P0301',
    description: 'Cylinder 1 Misfire Detected',
    category: 'powertrain',
    common_causes: ['Faulty spark plug'],
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    code: 'C1234',
    description: 'ABS Wheel Speed Sensor',
    category: 'chassis',
    common_causes: ['Faulty sensor'],
    created_at: '2024-01-01T00:00:00Z',
  },
]

describe('DtcCodeList', () => {
  it('renders all codes when no search query', () => {
    render(<DtcCodeList codes={mockCodes} />)
    expect(screen.getByText('P0301')).toBeInTheDocument()
    expect(screen.getByText('C1234')).toBeInTheDocument()
  })

  it('filters codes by code number', async () => {
    const user = userEvent.setup()
    render(<DtcCodeList codes={mockCodes} />)

    await user.type(screen.getByPlaceholderText(/search dtc codes/i), 'P03')
    expect(screen.getByText('P0301')).toBeInTheDocument()
    expect(screen.queryByText('C1234')).not.toBeInTheDocument()
  })

  it('filters codes by description', async () => {
    const user = userEvent.setup()
    render(<DtcCodeList codes={mockCodes} />)

    await user.type(screen.getByPlaceholderText(/search dtc codes/i), 'ABS')
    expect(screen.queryByText('P0301')).not.toBeInTheDocument()
    expect(screen.getByText('C1234')).toBeInTheDocument()
  })

  it('shows empty state when no codes match', async () => {
    const user = userEvent.setup()
    render(<DtcCodeList codes={mockCodes} />)

    await user.type(screen.getByPlaceholderText(/search dtc codes/i), 'ZZZZZ')
    expect(screen.getByText(/no dtc codes match your search/i)).toBeInTheDocument()
  })

  it('shows empty state when codes array is empty', () => {
    render(<DtcCodeList codes={[]} />)
    expect(screen.getByText(/no dtc codes available/i)).toBeInTheDocument()
  })
})
