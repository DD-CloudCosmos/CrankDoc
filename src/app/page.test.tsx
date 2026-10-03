import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import Home from './page'
import { getGarageBikeData } from '@/lib/garageBikes.server'
import { GARAGE_STORAGE_KEY } from '@/lib/garage'

vi.mock('@/lib/garageBikes.server', () => ({
  getGarageBikeData: vi.fn(),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

const bikes = [
  { id: 'bmw-id', make: 'BMW', model: 'R 1250 GS', imageUrl: 'https://x/gs.jpg', imageAlt: 'BMW R 1250 GS', treeCount: 8 },
  { id: 'mt07-id', make: 'Yamaha', model: 'MT-07', imageUrl: 'https://x/mt07.jpg', imageAlt: 'Yamaha MT-07', treeCount: 7 },
  { id: 'nophoto-id', make: 'KYMCO', model: 'Like 125i', imageUrl: null, imageAlt: null, treeCount: 8 },
]

async function renderHome() {
  render(await Home())
}

describe('Home page', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.mocked(getGarageBikeData).mockResolvedValue({ bikes, universalTreeCount: 18 })
  })

  it('renders the hero headline and CTAs', async () => {
    window.localStorage.setItem(GARAGE_STORAGE_KEY, JSON.stringify({ bikeIds: [], skill: null, onboarded: true }))
    await renderHome()
    expect(screen.getByRole('heading', { level: 1, name: /every fault has a reason/i })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /start diagnosing/i })[0]).toHaveAttribute('href', '/diagnose')
    expect(screen.getByRole('link', { name: /look up a code/i })).toHaveAttribute('href', '/dtc')
  })

  it('shows a real step from the showcase guide in the product window', async () => {
    window.localStorage.setItem(GARAGE_STORAGE_KEY, JSON.stringify({ bikes: [], onboarded: true }))
    await renderHome()
    const figure = screen.getByRole('figure')
    expect(within(figure).getByRole('heading', { name: 'Measure battery voltage' })).toBeInTheDocument()
    expect(within(figure).getByText('Care required')).toBeInTheDocument()
  })

  it('renders the highlight tiles with catalogue numbers', async () => {
    window.localStorage.setItem(GARAGE_STORAGE_KEY, JSON.stringify({ onboarded: true }))
    await renderHome()
    expect(screen.getByRole('heading', { name: /get the highlights/i })).toBeInTheDocument()
    expect(screen.getByText(/119 guides narrow it down/i)).toBeInTheDocument()
    expect(screen.getByText(/664 fault codes/i)).toBeInTheDocument()
    expect(screen.getByText('43 Nm')).toBeInTheDocument()
  })

  it('features only bikes that have a photo', async () => {
    window.localStorage.setItem(GARAGE_STORAGE_KEY, JSON.stringify({ onboarded: true }))
    await renderHome()
    const section = screen.getByRole('heading', { name: /find your ride/i }).closest('section')!
    expect(within(section).getByRole('link', { name: /yamaha mt-07/i })).toHaveAttribute('href', '/bikes/mt07-id')
    expect(within(section).queryByText('Like 125i')).not.toBeInTheDocument()
    expect(within(section).getByRole('link', { name: /see all 3 models/i })).toHaveAttribute('href', '/bikes')
  })

  it('hides the bikes section when no bikes could be loaded', async () => {
    vi.mocked(getGarageBikeData).mockResolvedValue({ bikes: [], universalTreeCount: 0 })
    window.localStorage.setItem(GARAGE_STORAGE_KEY, JSON.stringify({ onboarded: true }))
    await renderHome()
    expect(screen.queryByRole('heading', { name: /find your ride/i })).not.toBeInTheDocument()
  })

  it('opens onboarding on a first visit', async () => {
    await renderHome()
    expect(screen.getByRole('dialog', { name: /welcome to crankdoc/i })).toBeInTheDocument()
  })

  it("shows the user's garage once onboarded", async () => {
    window.localStorage.setItem(
      GARAGE_STORAGE_KEY,
      JSON.stringify({ bikeIds: ['mt07-id'], skill: 'home', onboarded: true })
    )
    await renderHome()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    const garage = screen.getByRole('heading', { name: 'Your Garage' }).closest('section')!
    expect(within(garage).getByRole('link', { name: 'Diagnose Yamaha MT-07' })).toHaveAttribute('href', '/diagnose?bike=mt07-id')
  })

  it('shows the safety disclaimer', async () => {
    window.localStorage.setItem(GARAGE_STORAGE_KEY, JSON.stringify({ onboarded: true }))
    await renderHome()
    expect(screen.getByText(/diagnostic guidance for educational reference only/i)).toBeInTheDocument()
  })
})
