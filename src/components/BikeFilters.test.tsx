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

  // --- Search input tests ---

  it('renders search input', () => {
    render(<BikeFilters availableMakes={[]} />)
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/search by make or model/i)).toBeInTheDocument()
  })

  it('handles search input change', async () => {
    const user = userEvent.setup()
    render(<BikeFilters availableMakes={[]} />)

    const searchInput = screen.getByRole('searchbox')
    await user.type(searchInput, 'c')

    // Controlled input calls push on each character
    expect(mockPush).toHaveBeenCalledWith('/bikes?search=c')
  })

  it('renders clear all when search is active', () => {
    const searchParamsWithSearch = new URLSearchParams('search=honda')
    vi.mocked(useSearchParams).mockReturnValue(searchParamsWithSearch as never)

    render(<BikeFilters availableMakes={[]} />)
    expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument()
  })

  // --- View toggle tests ---

  it('renders view toggle buttons', () => {
    render(<BikeFilters availableMakes={[]} />)
    expect(screen.getByRole('button', { name: /table view/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /grid view/i })).toBeInTheDocument()
  })

  it('table view is active by default', () => {
    render(<BikeFilters availableMakes={[]} />)
    const tableButton = screen.getByRole('button', { name: /table view/i })
    expect(tableButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('switches to grid view on click', async () => {
    const user = userEvent.setup()
    render(<BikeFilters availableMakes={[]} />)

    const gridButton = screen.getByRole('button', { name: /grid view/i })
    await user.click(gridButton)

    expect(mockPush).toHaveBeenCalledWith('/bikes?view=grid')
  })

  it('grid view button is active when view=grid', () => {
    const searchParamsWithGrid = new URLSearchParams('view=grid')
    vi.mocked(useSearchParams).mockReturnValue(searchParamsWithGrid as never)

    render(<BikeFilters availableMakes={[]} />)
    const gridButton = screen.getByRole('button', { name: /grid view/i })
    expect(gridButton).toHaveAttribute('aria-pressed', 'true')
  })

  // --- Result count tests ---

  it('shows result count when totalCount is provided', () => {
    render(<BikeFilters availableMakes={[]} totalCount={18} />)
    expect(screen.getByText('Showing 18 motorcycles')).toBeInTheDocument()
  })

  it('shows singular form for count of 1', () => {
    render(<BikeFilters availableMakes={[]} totalCount={1} />)
    expect(screen.getByText('Showing 1 motorcycle')).toBeInTheDocument()
  })

  it('does not show result count when totalCount is not provided', () => {
    render(<BikeFilters availableMakes={[]} />)
    expect(screen.queryByTestId('result-count')).not.toBeInTheDocument()
  })
})
