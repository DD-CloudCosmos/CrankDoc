import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter, useSearchParams } from 'next/navigation'
import { BikeFilters } from './BikeFilters'

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}))

describe('BikeFilters', () => {
  const mockPush = vi.fn()
  const mockSearchParams = new URLSearchParams()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as never)
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as never)
  })

  it('renders all category filter buttons', () => {
    render(<BikeFilters availableMakes={[]} />)
    expect(screen.getByRole('button', { name: /sport/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /naked/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cruiser/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /adventure/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /scooter/i })).toBeInTheDocument()
  })

  it('renders all available make filter buttons', () => {
    const makes = ['Honda', 'Yamaha', 'Kawasaki']
    render(<BikeFilters availableMakes={makes} />)

    expect(screen.getByRole('button', { name: /honda/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /yamaha/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /kawasaki/i })).toBeInTheDocument()
  })

  it('does not render clear filters button when no filters are active', () => {
    render(<BikeFilters availableMakes={['Honda']} />)
    expect(screen.queryByRole('button', { name: /clear all/i })).not.toBeInTheDocument()
  })

  it('renders clear filters button when category filter is active', () => {
    const searchParamsWithCategory = new URLSearchParams('category=sport')
    vi.mocked(useSearchParams).mockReturnValue(searchParamsWithCategory as never)

    render(<BikeFilters availableMakes={['Honda']} />)
    expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument()
  })

  it('renders clear filters button when make filter is active', () => {
    const searchParamsWithMake = new URLSearchParams('make=Honda')
    vi.mocked(useSearchParams).mockReturnValue(searchParamsWithMake as never)

    render(<BikeFilters availableMakes={['Honda']} />)
    expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument()
  })

  it('handles category filter selection', async () => {
    const user = userEvent.setup()
    render(<BikeFilters availableMakes={[]} />)

    const sportButton = screen.getByRole('button', { name: /sport/i })
    await user.click(sportButton)

    expect(mockPush).toHaveBeenCalledWith('/bikes?category=sport')
  })

  it('handles make filter selection', async () => {
    const user = userEvent.setup()
    render(<BikeFilters availableMakes={['Honda']} />)

    const hondaButton = screen.getByRole('button', { name: /honda/i })
    await user.click(hondaButton)

    expect(mockPush).toHaveBeenCalledWith('/bikes?make=Honda')
  })

  it('removes category filter when clicking active category', async () => {
    const user = userEvent.setup()
    const searchParamsWithCategory = new URLSearchParams('category=sport')
    vi.mocked(useSearchParams).mockReturnValue(searchParamsWithCategory as never)

    render(<BikeFilters availableMakes={[]} />)

    const sportButton = screen.getByRole('button', { name: /sport/i })
    await user.click(sportButton)

    expect(mockPush).toHaveBeenCalledWith('/bikes?')
  })

  it('removes make filter when clicking active make', async () => {
    const user = userEvent.setup()
    const searchParamsWithMake = new URLSearchParams('make=Honda')
    vi.mocked(useSearchParams).mockReturnValue(searchParamsWithMake as never)

    render(<BikeFilters availableMakes={['Honda']} />)

    const hondaButton = screen.getByRole('button', { name: /honda/i })
    await user.click(hondaButton)

    expect(mockPush).toHaveBeenCalledWith('/bikes?')
  })

  it('preserves existing filters when adding new filter', async () => {
    const user = userEvent.setup()
    const searchParamsWithCategory = new URLSearchParams('category=sport')
    vi.mocked(useSearchParams).mockReturnValue(searchParamsWithCategory as never)

    render(<BikeFilters availableMakes={['Honda']} />)

    const hondaButton = screen.getByRole('button', { name: /honda/i })
    await user.click(hondaButton)

    expect(mockPush).toHaveBeenCalledWith('/bikes?category=sport&make=Honda')
  })

  it('clears all filters when clear button is clicked', async () => {
    const user = userEvent.setup()
    const searchParamsWithFilters = new URLSearchParams('category=sport&make=Honda')
    vi.mocked(useSearchParams).mockReturnValue(searchParamsWithFilters as never)

    render(<BikeFilters availableMakes={['Honda']} />)

    const clearButton = screen.getByRole('button', { name: /clear all/i })
    await user.click(clearButton)

    expect(mockPush).toHaveBeenCalledWith('/bikes')
  })

  it('renders no make buttons when availableMakes is empty', () => {
    render(<BikeFilters availableMakes={[]} />)

    // Should still have category buttons
    expect(screen.getByRole('button', { name: /sport/i })).toBeInTheDocument()

    // Should not have any make-specific buttons beyond the category ones
    const allButtons = screen.getAllByRole('button')
    const categoryButtons = 5 // sport, naked, cruiser, adventure, scooter
    expect(allButtons.length).toBe(categoryButtons)
  })
})
