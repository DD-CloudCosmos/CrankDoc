import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import GlossaryPage from './page'

vi.mock('@/components/GlossaryList', () => ({
  GlossaryList: () => <div data-testid="glossary-list" />,
}))

describe('GlossaryPage', () => {
  it('renders the page title and description', () => {
    render(<GlossaryPage />)
    expect(screen.getByRole('heading', { name: 'Glossary', level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/terms, explained/i)).toBeInTheDocument()
  })

  it('renders the glossary list', () => {
    render(<GlossaryPage />)
    expect(screen.getByTestId('glossary-list')).toBeInTheDocument()
  })
})
