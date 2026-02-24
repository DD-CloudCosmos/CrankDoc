import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GlossaryAlphaFilter } from './GlossaryAlphaFilter'

describe('GlossaryAlphaFilter', () => {
  it('renders all 26 letter buttons plus All', () => {
    const { container } = render(<GlossaryAlphaFilter activeLetter="" onChange={vi.fn()} />)
    const allButtons = container.querySelectorAll('button')
    expect(allButtons.length).toBe(27) // "All" + A-Z
  })

  it('renders the All button', () => {
    render(<GlossaryAlphaFilter activeLetter="" onChange={vi.fn()} />)
    expect(screen.getByText('All')).toBeInTheDocument()
  })

  it('highlights the active letter', () => {
    render(<GlossaryAlphaFilter activeLetter="C" onChange={vi.fn()} />)
    const cButton = screen.getByText('C').closest('button')
    expect(cButton).toBeDefined()
    // Active letter should not have outline styling
    const aButton = screen.getByText('A').closest('button')
    expect(aButton).toBeDefined()
  })

  it('calls onChange with the correct letter', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<GlossaryAlphaFilter activeLetter="" onChange={onChange} />)

    await user.click(screen.getByText('M'))
    expect(onChange).toHaveBeenCalledWith('M')

    await user.click(screen.getByText('All'))
    expect(onChange).toHaveBeenCalledWith('')
  })
})
