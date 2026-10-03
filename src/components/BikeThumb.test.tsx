import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BikeThumb } from './BikeThumb'

describe('BikeThumb', () => {
  it('renders the photo when an image url is given', () => {
    render(<BikeThumb imageUrl="https://example.com/bike.jpg" alt="Yamaha MT-07" className="h-10" />)
    const img = screen.getByRole('img', { name: 'Yamaha MT-07' })
    expect(img.tagName).toBe('IMG')
    expect(img).toHaveAttribute('src', 'https://example.com/bike.jpg')
    expect(img).toHaveClass('h-10')
  })

  it('renders an accessible placeholder without an image', () => {
    render(<BikeThumb imageUrl={null} alt="KYMCO AK 550i" />)
    const placeholder = screen.getByRole('img', { name: 'KYMCO AK 550i' })
    expect(placeholder.tagName).toBe('SPAN')
  })
})
