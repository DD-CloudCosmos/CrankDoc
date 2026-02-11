import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import VinPage from './page'

describe('VinPage', () => {
  it('renders the page title', () => {
    render(<VinPage />)
    expect(screen.getByRole('heading', { name: /vin decoder/i, level: 1 })).toBeInTheDocument()
  })

  it('renders the VIN input', () => {
    render(<VinPage />)
    expect(screen.getByPlaceholderText(/enter 17-character vin/i)).toBeInTheDocument()
  })

  it('renders the decode button', () => {
    render(<VinPage />)
    expect(screen.getByRole('button', { name: /decode/i })).toBeInTheDocument()
  })
})
