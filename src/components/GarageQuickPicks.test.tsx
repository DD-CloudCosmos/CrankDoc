import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GarageQuickPicks } from './GarageQuickPicks'
import { GARAGE_STORAGE_KEY } from '@/lib/garage'

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

const motorcycles = [
  { id: 'a', make: 'BMW', model: 'R1250GS' },
  { id: 'b', make: 'Yamaha', model: 'MT-07' },
]

describe('GarageQuickPicks', () => {
  beforeEach(() => window.localStorage.clear())

  it('renders nothing with an empty garage', () => {
    const { container } = render(<GarageQuickPicks motorcycles={motorcycles} treeCounts={{}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('links straight to the guides for each garage bike', () => {
    window.localStorage.setItem(GARAGE_STORAGE_KEY, JSON.stringify({ bikeIds: ['b'], skill: null, onboarded: true }))
    render(<GarageQuickPicks motorcycles={motorcycles} treeCounts={{ b: 7 }} />)
    expect(screen.getByRole('heading', { name: 'Your Garage' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /yamaha mt-07/i })).toHaveAttribute('href', '/diagnose?bike=b')
    expect(screen.getByText('7 guides')).toBeInTheDocument()
    expect(screen.queryByText(/bmw/i)).not.toBeInTheDocument()
  })
})
