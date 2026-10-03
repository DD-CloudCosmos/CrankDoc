import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HomeHighlights } from './HomeHighlights'

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

describe('HomeHighlights', () => {
  it('renders the four tiles', () => {
    render(<HomeHighlights />)
    expect(screen.getAllByRole('article')).toHaveLength(4)
  })

  it('shows MT-07 torque specs from the service interval data in metric', () => {
    render(<HomeHighlights />)
    expect(screen.getByText('Drain plug').nextElementSibling).toHaveTextContent('43 Nm')
    expect(screen.getByText('Spark plug').nextElementSibling).toHaveTextContent('12 Nm')
    expect(screen.getByText('Rear axle nut').nextElementSibling).toHaveTextContent('105 Nm')
    expect(screen.getByText('Yamaha MT-07')).toBeInTheDocument()
  })

  it('features a real fault code linking to the code lookup', () => {
    render(<HomeHighlights />)
    const link = screen.getByRole('link', { name: /p0107/i })
    expect(link).toHaveAttribute('href', '/dtc')
    expect(link).toHaveTextContent('MAP Sensor Circuit Low Voltage')
  })

  it('shows the first question of the showcase guide', () => {
    render(<HomeHighlights />)
    expect(screen.getByText('When you press the starter button, what happens?')).toBeInTheDocument()
  })

  it('shows all three safety ratings', () => {
    render(<HomeHighlights />)
    expect(screen.getByText('Beginner-safe')).toBeInTheDocument()
    expect(screen.getByText('Care required')).toBeInTheDocument()
    expect(screen.getByText('Pro recommended')).toBeInTheDocument()
  })
})
