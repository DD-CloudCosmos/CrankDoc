import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import DtcPage from './page'

// Mock DtcCodeList since it's tested separately
vi.mock('@/components/DtcCodeList', () => ({
  DtcCodeList: () => <div data-testid="dtc-code-list">DtcCodeList</div>,
}))

describe('DtcPage', () => {
  it('renders the page title', () => {
    render(<DtcPage />)
    expect(screen.getByRole('heading', { name: /dtc lookup/i, level: 1 })).toBeInTheDocument()
  })

  it('renders the page description', () => {
    render(<DtcPage />)
    expect(screen.getByText(/search 600\+ motorcycle-specific dtcs/i)).toBeInTheDocument()
  })

  it('renders the DtcCodeList component', () => {
    render(<DtcPage />)
    expect(screen.getByTestId('dtc-code-list')).toBeInTheDocument()
  })
})
