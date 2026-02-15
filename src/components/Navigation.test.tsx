import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Navigation } from './Navigation'

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

describe('Navigation', () => {
  it('renders all nav items', () => {
    render(<Navigation />)
    // Each item appears in both mobile and desktop navs
    expect(screen.getAllByText('Home').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Diagnose').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Bikes').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('DTC').length).toBeGreaterThanOrEqual(1)
  })

  it('renders nav links with correct hrefs', () => {
    render(<Navigation />)
    const links = screen.getAllByRole('link')
    const hrefs = links.map((link) => link.getAttribute('href'))
    expect(hrefs).toContain('/')
    expect(hrefs).toContain('/diagnose')
    expect(hrefs).toContain('/bikes')
    expect(hrefs).toContain('/dtc')
  })

  it('applies active styling to the current route on desktop', () => {
    render(<Navigation />)
    // Desktop nav links with "Home" text — the active one gets bg-[#1F1F1F]
    const homeLinks = screen.getAllByText('Home')
    const desktopHomeLink = homeLinks.find((el) =>
      el.closest('a')?.className.includes('bg-[#1F1F1F]')
    )
    expect(desktopHomeLink).toBeDefined()
  })

  it('applies active opacity to the current route on mobile', () => {
    render(<Navigation />)
    const homeLinks = screen.getAllByText('Home')
    const mobileHomeLink = homeLinks.find((el) =>
      el.closest('a')?.className.includes('opacity-100')
    )
    expect(mobileHomeLink).toBeDefined()
  })

  it('applies inactive styling to non-active routes', () => {
    render(<Navigation />)
    const diagnoseLinks = screen.getAllByText('Diagnose')
    // At least one should have inactive desktop styling (text-foreground without bg-[#1F1F1F])
    const inactiveDesktop = diagnoseLinks.find(
      (el) => !el.closest('a')?.className.includes('bg-[#1F1F1F]')
    )
    expect(inactiveDesktop).toBeDefined()
  })
})
