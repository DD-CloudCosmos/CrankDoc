import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { ProductWindow } from './ProductWindow'

describe('ProductWindow', () => {
  it('describes the example for screen readers', () => {
    render(<ProductWindow />)
    expect(screen.getByRole('figure', { name: /example: step 3 of the bmw r1250gs/i })).toBeInTheDocument()
  })

  it('shows the answers that led to the current step', () => {
    render(<ProductWindow />)
    expect(screen.getByText('Nothing — dash is dark, no lights')).toBeInTheDocument()
    expect(screen.getByText('Connections look good')).toBeInTheDocument()
  })

  it('shows the current step with its safety rating and first instruction sentence', () => {
    render(<ProductWindow />)
    expect(screen.getByRole('heading', { name: 'Measure battery voltage' })).toBeInTheDocument()
    expect(screen.getByText('Care required')).toBeInTheDocument()
    expect(screen.getByText('Set multimeter to DC voltage (20V range).')).toBeInTheDocument()
  })

  it('lists the possible answers from the next question', () => {
    render(<ProductWindow />)
    const list = screen.getByText('What is the battery voltage?').nextElementSibling as HTMLElement
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
    expect(within(list).getByText(/12.6V or higher/)).toBeInTheDocument()
  })
})
