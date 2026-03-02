import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BikeAskAI } from './BikeAskAI'

vi.mock('./SmartSearch', () => ({
  SmartSearch: (props: Record<string, unknown>) => (
    <div
      data-testid="smart-search"
      data-motorcycle-id={props.motorcycleId}
      data-make={props.make}
      data-model={props.model}
    />
  ),
}))

describe('BikeAskAI', () => {
  const defaultProps = {
    motorcycleId: '123e4567-e89b-12d3-a456-426614174000',
    make: 'Honda',
    model: 'CBR600RR',
  }

  it('renders the "Ask AI about this bike" button', () => {
    render(<BikeAskAI {...defaultProps} />)
    expect(screen.getByRole('button', { name: /ask ai about this bike/i })).toBeInTheDocument()
  })

  it('shows Sparkles icon on the button', () => {
    render(<BikeAskAI {...defaultProps} />)
    const button = screen.getByRole('button', { name: /ask ai about this bike/i })
    const svg = button.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('h-4', 'w-4')
  })

  it('opens dialog when button is clicked', async () => {
    const user = userEvent.setup()
    render(<BikeAskAI {...defaultProps} />)

    const button = screen.getByRole('button', { name: /ask ai about this bike/i })
    await user.click(button)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('dialog title includes make and model', async () => {
    const user = userEvent.setup()
    render(<BikeAskAI {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /ask ai about this bike/i }))

    expect(screen.getByText(/ask about honda cbr600rr/i)).toBeInTheDocument()
  })

  it('SmartSearch component receives correct props', async () => {
    const user = userEvent.setup()
    render(<BikeAskAI {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /ask ai about this bike/i }))

    const smartSearch = screen.getByTestId('smart-search')
    expect(smartSearch).toHaveAttribute('data-motorcycle-id', '123e4567-e89b-12d3-a456-426614174000')
    expect(smartSearch).toHaveAttribute('data-make', 'Honda')
    expect(smartSearch).toHaveAttribute('data-model', 'CBR600RR')
  })

  it('renders with different make and model values', async () => {
    const user = userEvent.setup()
    render(<BikeAskAI motorcycleId="abc-123" make="Yamaha" model="MT-07" />)

    await user.click(screen.getByRole('button', { name: /ask ai about this bike/i }))

    expect(screen.getByText(/ask about yamaha mt-07/i)).toBeInTheDocument()
    const smartSearch = screen.getByTestId('smart-search')
    expect(smartSearch).toHaveAttribute('data-motorcycle-id', 'abc-123')
    expect(smartSearch).toHaveAttribute('data-make', 'Yamaha')
    expect(smartSearch).toHaveAttribute('data-model', 'MT-07')
  })
})
