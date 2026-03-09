import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SearchResultItem } from './SearchResultItem'
import type { SearchResultItem as SearchResultItemType } from '@/types/search.types'

vi.mock('next/link', () => ({
  default: ({ children, href, onClick, ...props }: { children: React.ReactNode; href: string; onClick?: () => void; [key: string]: unknown }) => (
    <a href={href} onClick={onClick} {...props}>{children}</a>
  ),
}))

const mockResult: SearchResultItemType = {
  id: '1',
  title: 'Honda CBR600RR',
  subtitle: '2003-2006 sport',
  href: '/bikes/1',
  category: 'bikes',
}

describe('SearchResultItem', () => {
  it('renders title and subtitle', () => {
    render(<SearchResultItem result={mockResult} />)
    expect(screen.getByText('Honda CBR600RR')).toBeInTheDocument()
    expect(screen.getByText('2003-2006 sport')).toBeInTheDocument()
  })

  it('links to the correct href', () => {
    render(<SearchResultItem result={mockResult} />)
    const link = screen.getByTestId('search-result-item')
    expect(link).toHaveAttribute('href', '/bikes/1')
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<SearchResultItem result={mockResult} onClick={onClick} />)
    fireEvent.click(screen.getByTestId('search-result-item'))
    expect(onClick).toHaveBeenCalled()
  })

  it('has minimum 44px touch target', () => {
    render(<SearchResultItem result={mockResult} />)
    const item = screen.getByTestId('search-result-item')
    expect(item.className).toContain('min-h-[44px]')
  })

  it('renders DTC result correctly', () => {
    const dtcResult: SearchResultItemType = {
      id: '2',
      title: 'P0301',
      subtitle: 'Cylinder 1 misfire detected',
      href: '/dtc?q=P0301',
      category: 'dtcCodes',
    }
    render(<SearchResultItem result={dtcResult} />)
    expect(screen.getByText('P0301')).toBeInTheDocument()
    expect(screen.getByText('Cylinder 1 misfire detected')).toBeInTheDocument()
  })
})
