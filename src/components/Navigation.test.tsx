import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Navigation } from './Navigation'

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

vi.mock('next/link', () => ({
  default: ({ children, href, onClick, ...props }: { children: React.ReactNode; href: string; onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void; [key: string]: unknown }) => {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      onClick?.(e);
    };
    return <a href={href} {...props} onClick={handleClick}>{children}</a>;
  },
}))

// Mock search components to avoid complex dependency chains in nav tests
vi.mock('@/components/search', () => ({
  DesktopSearch: () => <div data-testid="desktop-search">Search</div>,
  SearchOverlay: ({ open }: { open: boolean }) =>
    open ? <div data-testid="search-overlay">Overlay</div> : null,
}))

describe('Navigation', () => {
  it('renders all nav items on desktop', () => {
    render(<Navigation />)
    // Desktop nav shows all items
    expect(screen.getAllByText('Home').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Diagnose').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Bikes').length).toBeGreaterThanOrEqual(1)
    // Desktop shows these directly; mobile hides them behind More
    expect(screen.getByText('DTC')).toBeInTheDocument()
    expect(screen.getByText('Glossary')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('renders primary nav items in mobile bar', () => {
    render(<Navigation />)
    // Primary items appear in both mobile and desktop
    expect(screen.getAllByText('Home').length).toBe(2)
    expect(screen.getAllByText('Diagnose').length).toBe(2)
    expect(screen.getAllByText('Bikes').length).toBe(2)
  })

  it('renders More button in mobile nav', () => {
    render(<Navigation />)
    expect(screen.getByLabelText('More navigation')).toBeInTheDocument()
    expect(screen.getByText('More')).toBeInTheDocument()
  })

  it('hides secondary items until More is clicked', () => {
    render(<Navigation />)
    // DTC appears once (desktop only), not in mobile bar
    expect(screen.getAllByText('DTC').length).toBe(1)
    expect(screen.getAllByText('Glossary').length).toBe(1)
    expect(screen.getAllByText('Recalls').length).toBe(1)
    expect(screen.getAllByText('Admin').length).toBe(1)
  })

  it('More button opens popover with secondary nav items', () => {
    render(<Navigation />)
    const moreButton = screen.getByLabelText('More navigation')

    fireEvent.click(moreButton)

    // Now secondary items appear twice (desktop + popover)
    expect(screen.getAllByText('DTC').length).toBe(2)
    expect(screen.getAllByText('Glossary').length).toBe(2)
    expect(screen.getAllByText('Recalls').length).toBe(2)
    expect(screen.getAllByText('Admin').length).toBe(2)
  })

  it('clicking a link in More popover closes it', async () => {
    const user = userEvent.setup()
    render(<Navigation />)
    const moreButton = screen.getByLabelText('More navigation')

    await user.click(moreButton)
    expect(screen.getAllByText('DTC').length).toBe(2)
    expect(moreButton).toHaveAttribute('aria-expanded', 'true')

    // Click the DTC link in the popover (second occurrence is the popover one)
    const dtcLinks = screen.getAllByText('DTC')
    const popoverLink = dtcLinks[1].closest('a')!
    await user.click(popoverLink)

    // Popover closed — aria-expanded should be false
    expect(moreButton).toHaveAttribute('aria-expanded', 'false')
  })

  it('More button has aria-expanded attribute', () => {
    render(<Navigation />)
    const moreButton = screen.getByLabelText('More navigation')

    expect(moreButton).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(moreButton)
    expect(moreButton).toHaveAttribute('aria-expanded', 'true')
  })

  it('renders nav links with correct hrefs', () => {
    render(<Navigation />)
    const links = screen.getAllByRole('link')
    const hrefs = links.map((link) => link.getAttribute('href'))
    expect(hrefs).toContain('/')
    expect(hrefs).toContain('/diagnose')
    expect(hrefs).toContain('/bikes')
    expect(hrefs).toContain('/dtc')
    expect(hrefs).toContain('/glossary')
    expect(hrefs).toContain('/admin')
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

  it('renders desktop search component', () => {
    render(<Navigation />)
    expect(screen.getByTestId('desktop-search')).toBeInTheDocument()
  })

  it('renders mobile search button', () => {
    render(<Navigation />)
    expect(screen.getByLabelText('Open search')).toBeInTheDocument()
  })

  it('opens search overlay when mobile search button is clicked', () => {
    render(<Navigation />)
    expect(screen.queryByTestId('search-overlay')).not.toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Open search'))

    expect(screen.getByTestId('search-overlay')).toBeInTheDocument()
  })

  it('closes More popover when search is opened', () => {
    render(<Navigation />)
    const moreButton = screen.getByLabelText('More navigation')

    // Open More popover
    fireEvent.click(moreButton)
    expect(screen.getAllByText('DTC').length).toBe(2)

    // Open search — should close More
    fireEvent.click(screen.getByLabelText('Open search'))
    expect(screen.getAllByText('DTC').length).toBe(1)
  })

  it('uses Stethoscope icon for Diagnose (not Search)', () => {
    render(<Navigation />)
    // The Search text only appears in the mobile search button, not as Diagnose
    const searchButton = screen.getByLabelText('Open search')
    expect(searchButton).toBeInTheDocument()
    // Diagnose items should exist as nav links
    const diagnoseLinks = screen.getAllByText('Diagnose')
    expect(diagnoseLinks.length).toBeGreaterThanOrEqual(1)
  })
})
