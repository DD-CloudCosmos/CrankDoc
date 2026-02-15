import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Navigation } from './Navigation'

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

describe('Navigation', () => {
  it('renders all nav items', () => {
    render(<Navigation />)
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Diagnose')).toBeInTheDocument()
    expect(screen.getByText('Bikes')).toBeInTheDocument()
    expect(screen.getByText('DTC')).toBeInTheDocument()
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

  it('highlights the active route', () => {
    render(<Navigation />)
    const homeLink = screen.getByText('Home').closest('a')
    expect(homeLink?.className).toContain('text-primary')
  })
})
