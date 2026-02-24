import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GlossarySearch } from './GlossarySearch'

describe('GlossarySearch', () => {
  it('renders a search input with placeholder', () => {
    render(<GlossarySearch onSearch={vi.fn()} />)
    expect(screen.getByPlaceholderText(/search motorcycle terms/i)).toBeInTheDocument()
  })

  it('calls onSearch when user types', async () => {
    const onSearch = vi.fn()
    const user = userEvent.setup()
    render(<GlossarySearch onSearch={onSearch} />)

    await user.type(screen.getByPlaceholderText(/search motorcycle terms/i), 'carb')
    expect(onSearch).toHaveBeenCalledWith('carb')
  })
})
