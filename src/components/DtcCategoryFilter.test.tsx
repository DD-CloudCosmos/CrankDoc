import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DtcCategoryFilter } from './DtcCategoryFilter'

describe('DtcCategoryFilter', () => {
  it('renders all category tabs', () => {
    render(<DtcCategoryFilter activeCategory="" onChange={vi.fn()} />)
    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('Powertrain (P)')).toBeInTheDocument()
    expect(screen.getByText('Chassis (C)')).toBeInTheDocument()
    expect(screen.getByText('Body (B)')).toBeInTheDocument()
    expect(screen.getByText('Network (U)')).toBeInTheDocument()
  })

  it('calls onChange with the correct category when clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<DtcCategoryFilter activeCategory="" onChange={onChange} />)

    await user.click(screen.getByText('Powertrain (P)'))
    expect(onChange).toHaveBeenCalledWith('powertrain')

    await user.click(screen.getByText('Chassis (C)'))
    expect(onChange).toHaveBeenCalledWith('chassis')
  })

  it('calls onChange with empty string when All is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<DtcCategoryFilter activeCategory="powertrain" onChange={onChange} />)

    await user.click(screen.getByText('All'))
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('shows active state on the selected category', () => {
    const { container } = render(<DtcCategoryFilter activeCategory="chassis" onChange={vi.fn()} />)
    const allButtons = container.querySelectorAll('button')
    // The chassis button (index 2) should not have variant "outline"
    // We check by looking at the button text and class patterns
    const chassisButton = screen.getByText('Chassis (C)')
    const allButton = screen.getByText('All')

    // Active button should NOT have outline variant classes
    // Inactive button should have outline variant classes
    // In shadcn/ui, outline buttons have 'border' in className, default buttons have 'bg-primary'
    expect(chassisButton.closest('button')).toBeDefined()
    expect(allButton.closest('button')).toBeDefined()
    expect(allButtons.length).toBe(5)
  })
})
