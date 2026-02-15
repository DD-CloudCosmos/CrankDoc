import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GenerationNavSelector } from './GenerationNavSelector'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('GenerationNavSelector', () => {
  const mockGenerations = [
    { id: 'gen-1', generation: 'Gen 1', year_start: 2003, year_end: 2006 },
    { id: 'gen-2', generation: 'Gen 2', year_start: 2007, year_end: 2012 },
    { id: 'gen-3', generation: 'Gen 3', year_start: 2013, year_end: null },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders generation selector when multiple generations exist', () => {
    render(
      <GenerationNavSelector
        generations={mockGenerations}
        activeGenerationId="gen-1"
      />
    )
    expect(screen.getByText('Gen 1')).toBeInTheDocument()
    expect(screen.getByText('Gen 2')).toBeInTheDocument()
    expect(screen.getByText('Gen 3')).toBeInTheDocument()
  })

  it('renders nothing when only one generation exists', () => {
    const { container } = render(
      <GenerationNavSelector
        generations={[mockGenerations[0]]}
        activeGenerationId="gen-1"
      />
    )
    // GenerationSelector returns null for single generation
    expect(container.innerHTML).toBe('')
  })

  it('navigates to selected generation page on click', () => {
    render(
      <GenerationNavSelector
        generations={mockGenerations}
        activeGenerationId="gen-1"
      />
    )
    fireEvent.click(screen.getByText('Gen 2'))
    expect(mockPush).toHaveBeenCalledWith('/bikes/gen-2')
  })

  it('navigates to correct URL when clicking a different generation', () => {
    render(
      <GenerationNavSelector
        generations={mockGenerations}
        activeGenerationId="gen-2"
      />
    )
    fireEvent.click(screen.getByText('Gen 3'))
    expect(mockPush).toHaveBeenCalledWith('/bikes/gen-3')
  })
})
