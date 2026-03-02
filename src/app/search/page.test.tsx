import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SearchPage from './page'

// Mock SmartSearch since it's tested separately
vi.mock('@/components/SmartSearch', () => ({
  SmartSearch: () => <div data-testid="smart-search">SmartSearch</div>,
}))

// Mock SafeDisclaimer
vi.mock('@/components/SafeDisclaimer', () => ({
  SafeDisclaimer: ({ variant }: { variant: string }) => (
    <div data-testid="safe-disclaimer">SafeDisclaimer: {variant}</div>
  ),
}))

describe('SearchPage', () => {
  it('renders the page title', () => {
    render(<SearchPage />)
    expect(screen.getByRole('heading', { name: /smart search/i, level: 1 })).toBeInTheDocument()
  })

  it('renders the page description', () => {
    render(<SearchPage />)
    expect(screen.getByText(/ask anything about motorcycle maintenance/i)).toBeInTheDocument()
  })

  it('renders the SmartSearch component', () => {
    render(<SearchPage />)
    expect(screen.getByTestId('smart-search')).toBeInTheDocument()
  })

  it('renders the safety disclaimer', () => {
    render(<SearchPage />)
    expect(screen.getByTestId('safe-disclaimer')).toBeInTheDocument()
    expect(screen.getByText('SafeDisclaimer: compact')).toBeInTheDocument()
  })
})
