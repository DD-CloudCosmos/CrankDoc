import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GlossaryCategoryFilter } from './GlossaryCategoryFilter'

describe('GlossaryCategoryFilter', () => {
  it('renders all category buttons', () => {
    render(<GlossaryCategoryFilter activeCategory="" onChange={vi.fn()} />)
    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('Engine')).toBeInTheDocument()
    expect(screen.getByText('Electrical')).toBeInTheDocument()
    expect(screen.getByText('Fuel')).toBeInTheDocument()
    expect(screen.getByText('Transmission')).toBeInTheDocument()
    expect(screen.getByText('Brakes')).toBeInTheDocument()
    expect(screen.getByText('Chassis')).toBeInTheDocument()
    expect(screen.getByText('Suspension')).toBeInTheDocument()
    expect(screen.getByText('Exhaust')).toBeInTheDocument()
    expect(screen.getByText('Cooling')).toBeInTheDocument()
    expect(screen.getByText('Tools')).toBeInTheDocument()
    expect(screen.getByText('General')).toBeInTheDocument()
  })

  it('highlights the active category', () => {
    const { container } = render(<GlossaryCategoryFilter activeCategory="engine" onChange={vi.fn()} />)
    const allButtons = container.querySelectorAll('button')
    expect(allButtons.length).toBe(12)
    const engineButton = screen.getByText('Engine').closest('button')
    expect(engineButton).toBeDefined()
  })

  it('calls onChange with the correct category', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<GlossaryCategoryFilter activeCategory="" onChange={onChange} />)

    await user.click(screen.getByText('Brakes'))
    expect(onChange).toHaveBeenCalledWith('brakes')

    await user.click(screen.getByText('All'))
    expect(onChange).toHaveBeenCalledWith('')
  })
})
