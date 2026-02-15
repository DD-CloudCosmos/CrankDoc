import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DtcManufacturerFilter } from './DtcManufacturerFilter'

describe('DtcManufacturerFilter', () => {
  it('renders all manufacturer pills', () => {
    render(<DtcManufacturerFilter activeManufacturer="" onChange={vi.fn()} />)
    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('Harley-Davidson')).toBeInTheDocument()
    expect(screen.getByText('BMW')).toBeInTheDocument()
    expect(screen.getByText('Honda')).toBeInTheDocument()
    expect(screen.getByText('Yamaha')).toBeInTheDocument()
    expect(screen.getByText('Kawasaki')).toBeInTheDocument()
    expect(screen.getByText('Suzuki')).toBeInTheDocument()
    expect(screen.getByText('Ducati')).toBeInTheDocument()
    expect(screen.getByText('KTM')).toBeInTheDocument()
    expect(screen.getByText('Triumph')).toBeInTheDocument()
    expect(screen.getByText('Indian/Polaris')).toBeInTheDocument()
  })

  it('renders the Manufacturer label', () => {
    render(<DtcManufacturerFilter activeManufacturer="" onChange={vi.fn()} />)
    expect(screen.getByText('Manufacturer')).toBeInTheDocument()
  })

  it('calls onChange with the correct manufacturer when clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<DtcManufacturerFilter activeManufacturer="" onChange={onChange} />)

    await user.click(screen.getByText('BMW'))
    expect(onChange).toHaveBeenCalledWith('BMW')

    await user.click(screen.getByText('Honda'))
    expect(onChange).toHaveBeenCalledWith('Honda')
  })

  it('calls onChange with empty string when All is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<DtcManufacturerFilter activeManufacturer="BMW" onChange={onChange} />)

    await user.click(screen.getByText('All'))
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('renders correct number of buttons', () => {
    const { container } = render(<DtcManufacturerFilter activeManufacturer="" onChange={vi.fn()} />)
    const buttons = container.querySelectorAll('button')
    expect(buttons.length).toBe(11) // All + 10 manufacturers
  })
})
