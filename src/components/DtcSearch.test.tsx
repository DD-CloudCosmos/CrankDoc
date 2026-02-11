import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DtcSearch } from './DtcSearch'

describe('DtcSearch', () => {
  it('renders a search input', () => {
    render(<DtcSearch onSearch={vi.fn()} />)
    expect(screen.getByPlaceholderText(/search dtc codes/i)).toBeInTheDocument()
  })

  it('calls onSearch when user types', async () => {
    const onSearch = vi.fn()
    const user = userEvent.setup()
    render(<DtcSearch onSearch={onSearch} />)

    await user.type(screen.getByPlaceholderText(/search dtc codes/i), 'P03')
    expect(onSearch).toHaveBeenCalledWith('P03')
  })
})
