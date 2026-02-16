import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import RecallsPage from './page'

// Mock RecallList since it's tested separately
vi.mock('@/components/RecallList', () => ({
  RecallList: () => <div data-testid="recall-list">RecallList</div>,
}))

describe('RecallsPage', () => {
  it('renders the page title', () => {
    render(<RecallsPage />)
    expect(screen.getByRole('heading', { name: /recall lookup/i, level: 1 })).toBeInTheDocument()
  })

  it('renders the page description', () => {
    render(<RecallsPage />)
    expect(screen.getByText(/search nhtsa safety recalls/i)).toBeInTheDocument()
  })

  it('renders the RecallList component', () => {
    render(<RecallsPage />)
    expect(screen.getByTestId('recall-list')).toBeInTheDocument()
  })
})
