import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VinDecoder } from './VinDecoder'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('VinDecoder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the VIN input field', () => {
    render(<VinDecoder />)
    expect(screen.getByPlaceholderText(/enter 17-character vin/i)).toBeInTheDocument()
  })

  it('shows error when VIN is not 17 characters', async () => {
    const user = userEvent.setup()
    render(<VinDecoder />)

    await user.type(screen.getByPlaceholderText(/enter 17-character vin/i), 'SHORT')
    await user.click(screen.getByRole('button', { name: /decode/i }))

    expect(screen.getByText(/vin must be exactly 17 characters/i)).toBeInTheDocument()
  })

  it('displays decoded results on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        make: 'Honda',
        model: 'CBR600RR',
        year: 2020,
        vehicleType: 'MOTORCYCLE',
        cylinders: '4',
        fuelType: 'Gasoline',
      }),
    })

    const user = userEvent.setup()
    render(<VinDecoder />)

    await user.type(screen.getByPlaceholderText(/enter 17-character vin/i), '12345678901234567')
    await user.click(screen.getByRole('button', { name: /decode/i }))

    expect(await screen.findByText('Honda')).toBeInTheDocument()
    expect(screen.getByText('CBR600RR')).toBeInTheDocument()
    expect(screen.getByText('2020')).toBeInTheDocument()
  })

  it('shows error on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
    })

    const user = userEvent.setup()
    render(<VinDecoder />)

    await user.type(screen.getByPlaceholderText(/enter 17-character vin/i), '12345678901234567')
    await user.click(screen.getByRole('button', { name: /decode/i }))

    expect(await screen.findByText(/failed to decode vin/i)).toBeInTheDocument()
  })
})
