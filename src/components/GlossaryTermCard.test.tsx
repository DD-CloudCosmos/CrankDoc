import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GlossaryTermCard } from './GlossaryTermCard'
import type { GlossaryTerm } from '@/types/database.types'

const mockTerm: GlossaryTerm = {
  id: '1',
  term: 'Carburetor',
  slug: 'carburetor',
  definition: 'A device that blends air and fuel for an internal combustion engine.',
  category: 'Fuel',
  subcategory: null,
  aliases: ['carb', 'carburettor'],
  related_terms: ['Fuel Injector', 'Throttle Body'],
  illustration_url: '/illustrations/carburetor.svg',
  applies_to: ['sport', 'naked'],
  difficulty: 'intermediate',
  created_at: '2024-01-01T00:00:00Z',
}

describe('GlossaryTermCard', () => {
  it('renders term name and definition', () => {
    render(<GlossaryTermCard term={mockTerm} />)
    expect(screen.getByText('Carburetor')).toBeInTheDocument()
    expect(screen.getByText('A device that blends air and fuel for an internal combustion engine.')).toBeInTheDocument()
  })

  it('shows aliases when present', () => {
    render(<GlossaryTermCard term={mockTerm} />)
    expect(screen.getByText('Also known as: carb, carburettor')).toBeInTheDocument()
  })

  it('shows illustration when illustration_url exists', () => {
    render(<GlossaryTermCard term={mockTerm} />)
    const img = screen.getByAltText('Carburetor')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', '/illustrations/carburetor.svg')
  })

  it('shows category and difficulty badges', () => {
    render(<GlossaryTermCard term={mockTerm} />)
    expect(screen.getByText('Fuel')).toBeInTheDocument()
    expect(screen.getByText('Intermediate')).toBeInTheDocument()
  })

  it('shows related terms as buttons', () => {
    render(<GlossaryTermCard term={mockTerm} />)
    expect(screen.getByText('See also:')).toBeInTheDocument()
    expect(screen.getByText('Fuel Injector')).toBeInTheDocument()
    expect(screen.getByText('Throttle Body')).toBeInTheDocument()
  })

  it('calls onRelatedTermClick when a related term is clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<GlossaryTermCard term={mockTerm} onRelatedTermClick={onClick} />)

    await user.click(screen.getByText('Fuel Injector'))
    expect(onClick).toHaveBeenCalledWith('Fuel Injector')
  })

  it('handles missing optional fields gracefully', () => {
    const minimalTerm: GlossaryTerm = {
      id: '2',
      term: 'Spark Plug',
      slug: 'spark-plug',
      definition: 'A device that delivers electric current to the combustion chamber.',
      category: 'Engine',
      subcategory: null,
      aliases: null,
      related_terms: null,
      illustration_url: null,
      applies_to: null,
      difficulty: null,
      created_at: '2024-01-01T00:00:00Z',
    }

    render(<GlossaryTermCard term={minimalTerm} />)
    expect(screen.getByText('Spark Plug')).toBeInTheDocument()
    expect(screen.getByText('A device that delivers electric current to the combustion chamber.')).toBeInTheDocument()
    expect(screen.queryByText(/also known as/i)).not.toBeInTheDocument()
    expect(screen.queryByText('See also:')).not.toBeInTheDocument()
    expect(screen.queryByText('Beginner')).not.toBeInTheDocument()
  })
})
