import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Navigation } from './Navigation'

const mockPathname = vi.fn(() => '/')
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, onClick, ...props }: { children: React.ReactNode; href: string; onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void; [key: string]: unknown }) => {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      onClick?.(e)
    }
    return <a href={href} {...props} onClick={handleClick}>{children}</a>
  },
}))

// Mock search components to avoid complex dependency chains in nav tests
vi.mock('@/components/search', () => ({
  DesktopSearch: () => <div data-testid="desktop-search">Search</div>,
  SearchOverlay: ({ open }: { open: boolean }) =>
    open ? <div data-testid="search-overlay">Overlay</div> : null,
}))

function getTabBar() {
  return screen.getByRole('navigation', { name: 'Tabs' })
}

function getDesktopNav() {
  return screen.getByRole('navigation', { name: 'Primary' })
}

describe('Navigation', () => {
  beforeEach(() => {
    mockPathname.mockReturnValue('/')
  })

  it('renders the logo linking home', () => {
    render(<Navigation />)
    expect(screen.getByRole('link', { name: 'CrankDoc home' })).toHaveAttribute('href', '/')
  })

  it('renders desktop links including VIN', () => {
    render(<Navigation />)
    const nav = getDesktopNav()
    for (const name of ['Diagnose', 'Bikes', 'Codes', 'Glossary', 'Recalls', 'VIN']) {
      expect(within(nav).getByRole('link', { name })).toBeInTheDocument()
    }
  })

  it('renders four tabs plus More in the mobile tab bar', () => {
    render(<Navigation />)
    const tabs = getTabBar()
    for (const name of ['Home', 'Diagnose', 'Bikes', 'Codes']) {
      expect(within(tabs).getByRole('link', { name })).toBeInTheDocument()
    }
    expect(within(tabs).getByLabelText('More navigation')).toBeInTheDocument()
  })

  it('hides secondary items until More is opened', () => {
    render(<Navigation />)
    const tabs = getTabBar()
    expect(within(tabs).queryByRole('link', { name: 'VIN Decoder' })).not.toBeInTheDocument()
    expect(within(tabs).queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument()
  })

  it('More opens a menu with Glossary, Recalls, VIN Decoder and Admin', () => {
    render(<Navigation />)
    fireEvent.click(screen.getByLabelText('More navigation'))
    const tabs = getTabBar()
    expect(within(tabs).getByRole('link', { name: 'Glossary' })).toHaveAttribute('href', '/glossary')
    expect(within(tabs).getByRole('link', { name: 'Recalls' })).toHaveAttribute('href', '/recalls')
    expect(within(tabs).getByRole('link', { name: 'VIN Decoder' })).toHaveAttribute('href', '/vin')
    expect(within(tabs).getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin')
  })

  it('More toggles aria-expanded', () => {
    render(<Navigation />)
    const more = screen.getByLabelText('More navigation')
    expect(more).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(more)
    expect(more).toHaveAttribute('aria-expanded', 'true')
  })

  it('clicking a link in the More menu closes it', async () => {
    const user = userEvent.setup()
    render(<Navigation />)
    const more = screen.getByLabelText('More navigation')
    await user.click(more)
    await user.click(within(getTabBar()).getByRole('link', { name: 'Admin' }))
    expect(more).toHaveAttribute('aria-expanded', 'false')
  })

  it('Escape closes the More menu', async () => {
    const user = userEvent.setup()
    render(<Navigation />)
    const more = screen.getByLabelText('More navigation')
    await user.click(more)
    await user.keyboard('{Escape}')
    expect(more).toHaveAttribute('aria-expanded', 'false')
  })

  it('clicking outside closes the More menu', async () => {
    const user = userEvent.setup()
    render(<Navigation />)
    const more = screen.getByLabelText('More navigation')
    await user.click(more)
    await user.click(screen.getByRole('link', { name: 'CrankDoc home' }))
    expect(more).toHaveAttribute('aria-expanded', 'false')
  })

  it('marks the current tab with aria-current and the accent colour', () => {
    render(<Navigation />)
    const home = within(getTabBar()).getByRole('link', { name: 'Home' })
    expect(home).toHaveAttribute('aria-current', 'page')
    expect(home).toHaveClass('text-primary')
    const bikes = within(getTabBar()).getByRole('link', { name: 'Bikes' })
    expect(bikes).not.toHaveAttribute('aria-current')
    expect(bikes).toHaveClass('text-muted-foreground')
  })

  it('treats nested routes as active', () => {
    mockPathname.mockReturnValue('/bikes/abc-123')
    render(<Navigation />)
    expect(within(getTabBar()).getByRole('link', { name: 'Bikes' })).toHaveAttribute('aria-current', 'page')
    expect(within(getDesktopNav()).getByRole('link', { name: 'Bikes' })).toHaveAttribute('aria-current', 'page')
    expect(within(getTabBar()).getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current')
  })

  it('highlights More when the current page lives behind it', () => {
    mockPathname.mockReturnValue('/glossary')
    render(<Navigation />)
    expect(screen.getByLabelText('More navigation')).toHaveClass('text-primary')
  })

  it('renders desktop search component', () => {
    render(<Navigation />)
    expect(screen.getByTestId('desktop-search')).toBeInTheDocument()
  })

  it('opens search overlay from the mobile search button', () => {
    render(<Navigation />)
    expect(screen.queryByTestId('search-overlay')).not.toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Open search'))
    expect(screen.getByTestId('search-overlay')).toBeInTheDocument()
  })

  it('closes the More menu when search is opened', () => {
    render(<Navigation />)
    const more = screen.getByLabelText('More navigation')
    fireEvent.click(more)
    fireEvent.click(screen.getByLabelText('Open search'))
    expect(more).toHaveAttribute('aria-expanded', 'false')
  })
})
