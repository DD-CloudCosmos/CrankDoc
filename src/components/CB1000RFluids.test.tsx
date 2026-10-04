import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CB1000RFluids } from './CB1000RFluids'
import { cb1000rFluids } from '@/lib/cb1000r'

describe('CB1000R fluids', () => {
  it('keeps all quantities and specifications behind collapsed rows', () => {
    render(<CB1000RFluids />)
    for (const fluid of cb1000rFluids) {
      expect(screen.getByText(fluid.label).closest('details')).not.toHaveAttribute('open')
      if (fluid.capacity) expect(screen.getByText(fluid.capacity)).toBeInTheDocument()
      if (fluid.spec) expect(screen.getByText(fluid.spec)).toBeInTheDocument()
    }
  })
  it('finds specifications, opens matching fluids, and clears the filter', () => {
    render(<CB1000RFluids />)
    const input = screen.getByRole('searchbox', { name: 'Search fluids' })
    fireEvent.change(input, { target: { value: 'DOT 4' } })
    expect(screen.getByText('Brake Fluid').closest('details')).toHaveAttribute('open')
    expect(screen.getByText('Clutch Fluid').closest('details')).toHaveAttribute('open')
    expect(screen.queryByText('Engine Oil')).not.toBeInTheDocument()
    fireEvent.change(input, { target: { value: '542' } })
    expect(screen.getByText('Fork Oil').closest('details')).toHaveAttribute('open')
    expect(screen.getByText(/CB1000R 511.*CB1000RA 542/)).toBeInTheDocument()
    fireEvent.change(input, { target: { value: 'nothing matches' } })
    expect(screen.getByRole('status')).toHaveTextContent('No fluids')
    fireEvent.change(input, { target: { value: '' } })
    expect(screen.getByText('Engine Oil').closest('details')).not.toHaveAttribute('open')
  })
})
