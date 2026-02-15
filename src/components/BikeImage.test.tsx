import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BikeImage } from './BikeImage'
import type { MotorcycleImage } from '@/types/database.types'

const mockImage: MotorcycleImage = {
  id: 'img-1',
  motorcycle_id: 'moto-1',
  image_url: 'https://example.com/cbr600rr.jpg',
  alt_text: 'Honda CBR600RR side profile',
  is_primary: true,
  source_attribution: 'Photo by John Doe',
  created_at: '2024-01-01T00:00:00Z',
}

describe('BikeImage', () => {
  it('renders an image when image prop is provided', () => {
    render(<BikeImage image={mockImage} make="Honda" model="CBR600RR" />)
    const img = screen.getByAltText('Honda CBR600RR side profile')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/cbr600rr.jpg')
  })

  it('applies warm-tone CSS filter to the image', () => {
    render(<BikeImage image={mockImage} make="Honda" model="CBR600RR" />)
    const img = screen.getByAltText('Honda CBR600RR side profile')
    expect(img.style.filter).toBe('sepia(15%) saturate(85%) brightness(102%)')
  })

  it('shows source attribution when available', () => {
    render(<BikeImage image={mockImage} make="Honda" model="CBR600RR" />)
    expect(screen.getByText('Photo by John Doe')).toBeInTheDocument()
  })

  it('does not show attribution when not available', () => {
    const imageNoAttribution = { ...mockImage, source_attribution: null }
    render(<BikeImage image={imageNoAttribution} make="Honda" model="CBR600RR" />)
    expect(screen.queryByText('Photo by John Doe')).not.toBeInTheDocument()
  })

  it('renders placeholder when no image is provided', () => {
    render(<BikeImage make="Honda" model="CBR600RR" />)
    expect(screen.getByText('Honda CBR600RR')).toBeInTheDocument()
  })

  it('renders placeholder when image is null', () => {
    render(<BikeImage image={null} make="Yamaha" model="MT-07" />)
    expect(screen.getByText('Yamaha MT-07')).toBeInTheDocument()
  })

  it('renders placeholder SVG when no image', () => {
    const { container } = render(<BikeImage make="Honda" model="CBR600RR" />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  it('applies custom className', () => {
    const { container } = render(
      <BikeImage make="Honda" model="CBR600RR" className="w-full max-w-md" />
    )
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.className).toContain('w-full')
    expect(wrapper.className).toContain('max-w-md')
  })
})
