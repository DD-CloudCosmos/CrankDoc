import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GarageStrip } from './GarageStrip'
import { GARAGE_STORAGE_KEY } from '@/lib/garage'

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

const bikes = [
  { id: 'a', make: 'BMW', model: 'R 1250 GS', imageUrl: null, imageAlt: null, treeCount: 8 },
  { id: 'b', make: 'Honda', model: 'CBR600RR', imageUrl: null, imageAlt: null, treeCount: 1 },
]

function store(value: object) {
  window.localStorage.setItem(GARAGE_STORAGE_KEY, JSON.stringify(value))
}

describe('GarageStrip', () => {
  beforeEach(() => window.localStorage.clear())

  it('renders nothing before onboarding', () => {
    const { container } = render(<GarageStrip bikes={bikes} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('lists saved bikes with diagnose links and guide counts', () => {
    store({ bikeIds: ['a', 'b'], skill: null, onboarded: true })
    render(<GarageStrip bikes={bikes} />)
    expect(screen.getByRole('link', { name: 'Diagnose BMW R 1250 GS' })).toHaveAttribute('href', '/diagnose?bike=a')
    expect(screen.getByRole('link', { name: 'Open My Garage' })).toHaveAttribute('href', '/garage')
    expect(screen.getByText('8 guides')).toBeInTheDocument()
    expect(screen.getByText('1 guide')).toBeInTheDocument()
  })

  it('ignores saved ids that are no longer in the catalogue', () => {
    store({ bikeIds: ['gone'], skill: null, onboarded: true })
    render(<GarageStrip bikes={bikes} />)
    expect(screen.getByText(/add your bikes/i)).toBeInTheDocument()
  })

  it('Edit and Add a bike reopen onboarding', async () => {
    const user = userEvent.setup()
    store({ bikeIds: [], skill: null, onboarded: true })
    render(<GarageStrip bikes={bikes} />)
    await user.click(screen.getByRole('button', { name: /add a bike/i }))
    expect(JSON.parse(window.localStorage.getItem(GARAGE_STORAGE_KEY)!).onboarded).toBe(false)
  })

  it('Edit keeps the saved bikes', async () => {
    const user = userEvent.setup()
    store({ bikeIds: ['a'], skill: 'pro', onboarded: true })
    render(<GarageStrip bikes={bikes} />)
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(JSON.parse(window.localStorage.getItem(GARAGE_STORAGE_KEY)!)).toEqual({ bikeIds: ['a'], skill: 'pro', onboarded: false })
  })
})
