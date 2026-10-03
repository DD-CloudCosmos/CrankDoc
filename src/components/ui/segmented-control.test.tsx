import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SegmentedControl } from './segmented-control'

const options = [
  { value: 'grid', label: 'Grid' },
  { value: 'table', label: 'Table' },
  { value: 'list', label: 'List' },
] as const

describe('SegmentedControl', () => {
  it('renders a labelled radio group with the selected option checked', () => {
    render(<SegmentedControl aria-label="View" options={[...options]} value="table" onChange={() => {}} />)
    expect(screen.getByRole('radiogroup', { name: 'View' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Table' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Grid' })).toHaveAttribute('aria-checked', 'false')
  })

  it('calls onChange when an option is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SegmentedControl aria-label="View" options={[...options]} value="grid" onChange={onChange} />)
    await user.click(screen.getByRole('radio', { name: 'List' }))
    expect(onChange).toHaveBeenCalledWith('list')
  })

  it('only the selected option is in the tab order', () => {
    render(<SegmentedControl aria-label="View" options={[...options]} value="grid" onChange={() => {}} />)
    expect(screen.getByRole('radio', { name: 'Grid' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('radio', { name: 'Table' })).toHaveAttribute('tabindex', '-1')
  })

  it('moves selection with arrow keys and wraps around', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SegmentedControl aria-label="View" options={[...options]} value="grid" onChange={onChange} />)
    screen.getByRole('radio', { name: 'Grid' }).focus()
    await user.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenLastCalledWith('table')
    // Back on the first option, ArrowLeft wraps to the last one
    screen.getByRole('radio', { name: 'Grid' }).focus()
    await user.keyboard('{ArrowLeft}')
    expect(onChange).toHaveBeenLastCalledWith('list')
  })

  it('ignores unrelated keys', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SegmentedControl aria-label="View" options={[...options]} value="grid" onChange={onChange} />)
    screen.getByRole('radio', { name: 'Grid' }).focus()
    await user.keyboard('a')
    expect(onChange).not.toHaveBeenCalled()
  })
})
