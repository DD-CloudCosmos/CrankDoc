import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BikeImage } from './BikeImage'

const mockImage = {
  image_url: 'https://example.com/cbr600rr.jpg',
  alt_text: 'Honda CBR600RR side profile',
  source_attribution: 'Photo by John Doe',
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

  // --- Thumbnail variant tests ---

  it('renders thumbnail size with smaller dimensions', () => {
    const { container } = render(
      <BikeImage image={mockImage} make="Honda" model="CBR600RR" size="thumbnail" />
    )
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.className).toContain('w-10')
    expect(wrapper.className).toContain('h-7')
    expect(wrapper.className).toContain('rounded-[6px]')
  })

  it('hides attribution in thumbnail mode', () => {
    render(<BikeImage image={mockImage} make="Honda" model="CBR600RR" size="thumbnail" />)
    expect(screen.queryByText('Photo by John Doe')).not.toBeInTheDocument()
  })

  it('renders thumbnail placeholder without text label', () => {
    render(<BikeImage make="Honda" model="CBR600RR" size="thumbnail" />)
    expect(screen.queryByText('Honda CBR600RR')).not.toBeInTheDocument()
  })

  it('renders thumbnail placeholder with smaller SVG', () => {
    const { container } = render(
      <BikeImage make="Honda" model="CBR600RR" size="thumbnail" />
    )
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    const svgClass = svg?.getAttribute('class') || ''
    expect(svgClass).toContain('h-4')
    expect(svgClass).toContain('w-6')
  })

  it('defaults to full size when size prop is omitted', () => {
    const { container } = render(
      <BikeImage make="Honda" model="CBR600RR" />
    )
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.className).toContain('rounded-[24px]')
    expect(wrapper.className).not.toContain('w-10')
  })
})
