import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Onboarding } from './Onboarding'
import { GARAGE_STORAGE_KEY, type GarageBikeOption } from '@/lib/garage'

vi.mock('next/link', () => ({
  default: ({ children, href, onClick, ...props }: { children: React.ReactNode; href: string; onClick?: () => void; [key: string]: unknown }) => (
    <a href={href} onClick={(e) => { e.preventDefault(); onClick?.() }} {...props}>{children}</a>
  ),
}))

const bikes: GarageBikeOption[] = [
  { id: 'bmw-id', make: 'BMW', model: 'R 1250 GS', imageUrl: null, imageAlt: null, treeCount: 8 },
  { id: 'mt07-id', make: 'Yamaha', model: 'MT-07', imageUrl: 'https://example.com/mt07.jpg', imageAlt: 'MT-07', treeCount: 7 },
]

function storedGarage() {
  return JSON.parse(window.localStorage.getItem(GARAGE_STORAGE_KEY) ?? 'null')
}

describe('Onboarding', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.body.style.overflow = ''
  })

  it('shows the welcome screen on first visit', () => {
    render(<Onboarding bikes={bikes} universalTreeCount={18} />)
    expect(screen.getByRole('dialog', { name: /welcome to crankdoc/i })).toBeInTheDocument()
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('does not show once the garage is onboarded', () => {
    window.localStorage.setItem(GARAGE_STORAGE_KEY, JSON.stringify({ bikeIds: [], skill: null, onboarded: true }))
    render(<Onboarding bikes={bikes} universalTreeCount={18} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('"Not now" skips onboarding and remembers it', async () => {
    const user = userEvent.setup()
    render(<Onboarding bikes={bikes} universalTreeCount={18} />)
    await user.click(screen.getByRole('button', { name: 'Not now' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(storedGarage().onboarded).toBe(true)
    expect(document.body.style.overflow).toBe('')
  })

  it('Escape skips onboarding', async () => {
    const user = userEvent.setup()
    render(<Onboarding bikes={bikes} universalTreeCount={18} />)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('walks through bikes and experience to the done screen', async () => {
    const user = userEvent.setup()
    render(<Onboarding bikes={bikes} universalTreeCount={18} />)

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByRole('dialog', { name: 'Your Garage' })).toBeInTheDocument()

    // Continue is disabled until a bike is chosen
    expect(screen.getByRole('button', { name: 'Choose a Bike' })).toBeDisabled()
    const bmw = screen.getByRole('checkbox', { name: 'BMW R 1250 GS' })
    await user.click(bmw)
    expect(bmw).toHaveAttribute('aria-checked', 'true')
    expect(storedGarage().bikeIds).toEqual(['bmw-id'])

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByRole('dialog', { name: 'Experience' })).toBeInTheDocument()
    const beginner = screen.getByRole('radio', { name: /beginner/i })
    await user.click(beginner)
    expect(beginner).toHaveAttribute('aria-checked', 'true')

    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.getByRole('dialog', { name: /you're all set/i })).toBeInTheDocument()
    expect(screen.getByText('BMW R 1250 GS added. 26 guides ready to go.')).toBeInTheDocument()
    expect(storedGarage()).toEqual({ bikeIds: ['bmw-id'], skill: 'beginner', onboarded: true })

    // One bike → Start Diagnosing goes straight to that bike
    expect(screen.getByRole('link', { name: 'Start Diagnosing' })).toHaveAttribute('href', '/diagnose?bike=bmw-id')
  })

  it('links to the bike picker when several bikes are chosen, and closes from done', async () => {
    const user = userEvent.setup()
    render(<Onboarding bikes={bikes} universalTreeCount={18} />)
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('checkbox', { name: 'BMW R 1250 GS' }))
    await user.click(screen.getByRole('checkbox', { name: 'Yamaha MT-07' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.getByText('2 bikes added. 33 guides ready to go.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Start Diagnosing' })).toHaveAttribute('href', '/diagnose')

    await user.click(screen.getByRole('button', { name: 'Explore CrankDoc' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('back buttons return to the previous step and Skip works mid-flow', async () => {
    const user = userEvent.setup()
    render(<Onboarding bikes={bikes} universalTreeCount={18} />)
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('checkbox', { name: 'Yamaha MT-07' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Garage' }))
    expect(screen.getByRole('dialog', { name: 'Your Garage' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('dialog', { name: /welcome/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Skip' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(storedGarage()).toEqual({ bikeIds: ['mt07-id'], skill: null, onboarded: true })
  })

  it('lets the user continue when no bikes could be loaded', async () => {
    const user = userEvent.setup()
    render(<Onboarding bikes={[]} universalTreeCount={18} />)
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText(/couldn't be loaded/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled()
  })
})
