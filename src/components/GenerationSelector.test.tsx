import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GenerationSelector } from './GenerationSelector'

const mockGenerations = [
  { id: 'gen-1', generation: 'Gen 1', year_start: 2003, year_end: 2006 },
  { id: 'gen-2', generation: 'Gen 2', year_start: 2007, year_end: 2012 },
  { id: 'gen-3', generation: null, year_start: 2013, year_end: null },
]

describe('GenerationSelector', () => {
  it('renders generation pills when multiple generations exist', () => {
    render(
      <GenerationSelector
        generations={mockGenerations}
        activeGenerationId="gen-1"
        onSelect={vi.fn()}
      />
    )
    expect(screen.getByText('Gen 1')).toBeInTheDocument()
    expect(screen.getByText('Gen 2')).toBeInTheDocument()
    expect(screen.getByText('2013-present')).toBeInTheDocument()
  })

  it('returns null when only one generation exists', () => {
    const singleGen = [{ id: 'gen-1', generation: 'Only Gen', year_start: 2020, year_end: null }]
    const { container } = render(
      <GenerationSelector
        generations={singleGen}
        activeGenerationId="gen-1"
        onSelect={vi.fn()}
      />
    )
    expect(container.innerHTML).toBe('')
  })

  it('returns null when no generations exist', () => {
    const { container } = render(
      <GenerationSelector
        generations={[]}
        activeGenerationId=""
        onSelect={vi.fn()}
      />
    )
    expect(container.innerHTML).toBe('')
  })

  it('calls onSelect when a generation pill is clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <GenerationSelector
        generations={mockGenerations}
        activeGenerationId="gen-1"
        onSelect={onSelect}
      />
    )

    await user.click(screen.getByText('Gen 2'))
    expect(onSelect).toHaveBeenCalledWith('gen-2')
  })

  it('highlights the active generation', () => {
    const { container } = render(
      <GenerationSelector
        generations={mockGenerations}
        activeGenerationId="gen-2"
        onSelect={vi.fn()}
      />
    )
    const buttons = container.querySelectorAll('button')
    // Active button (gen-2) should have dark background class
    const gen2Button = screen.getByText('Gen 2').closest('button')!
    expect(gen2Button.className).toContain('bg-[#1F1F1F]')

    // Inactive buttons should have outline/background class
    const gen1Button = screen.getByText('Gen 1').closest('button')!
    expect(gen1Button.className).toContain('bg-background')

    expect(buttons.length).toBe(3)
  })

  it('formats year range as "present" when year_end is null', () => {
    render(
      <GenerationSelector
        generations={mockGenerations}
        activeGenerationId="gen-1"
        onSelect={vi.fn()}
      />
    )
    expect(screen.getByText('2013-present')).toBeInTheDocument()
  })

  it('does not duplicate years when generation already contains them', () => {
    const generationsWithYears = [
      { id: 'gen-a', generation: 'Gen 1 (2003-2004)', year_start: 2003, year_end: 2004 },
      { id: 'gen-b', generation: 'Gen 2 (2005-2006)', year_start: 2005, year_end: 2006 },
    ]
    render(
      <GenerationSelector
        generations={generationsWithYears}
        activeGenerationId="gen-a"
        onSelect={vi.fn()}
      />
    )
    // Should show the generation string as-is, NOT "Gen 1 (2003-2004) (2003-2004)"
    expect(screen.getByText('Gen 1 (2003-2004)')).toBeInTheDocument()
    expect(screen.getByText('Gen 2 (2005-2006)')).toBeInTheDocument()
    expect(screen.queryByText(/\(2003-2004\).*\(2003-2004\)/)).not.toBeInTheDocument()
  })

  it('shows only year range when generation name is null', () => {
    render(
      <GenerationSelector
        generations={mockGenerations}
        activeGenerationId="gen-1"
        onSelect={vi.fn()}
      />
    )
    // gen-3 has null generation name, should show just the year range
    const gen3Button = screen.getByText('2013-present')
    expect(gen3Button).toBeInTheDocument()
  })
})
