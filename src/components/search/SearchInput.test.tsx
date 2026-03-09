import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SearchInput } from './SearchInput'

describe('SearchInput', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    onClear: vi.fn(),
    isOpen: false,
    resultsId: 'search-results',
  }

  it('renders with placeholder text', () => {
    render(<SearchInput {...defaultProps} />)
    expect(screen.getByPlaceholderText(/search bikes/i)).toBeInTheDocument()
  })

  it('calls onChange when user types', () => {
    const onChange = vi.fn()
    render(<SearchInput {...defaultProps} onChange={onChange} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'honda' } })
    expect(onChange).toHaveBeenCalledWith('honda')
  })

  it('shows clear button when value is non-empty', () => {
    render(<SearchInput {...defaultProps} value="test" />)
    expect(screen.getByLabelText('Clear search')).toBeInTheDocument()
  })

  it('does not show clear button when value is empty', () => {
    render(<SearchInput {...defaultProps} value="" />)
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument()
  })

  it('calls onClear when clear button is clicked', () => {
    const onClear = vi.fn()
    render(<SearchInput {...defaultProps} value="test" onClear={onClear} />)
    fireEvent.click(screen.getByLabelText('Clear search'))
    expect(onClear).toHaveBeenCalled()
  })

  it('has combobox ARIA attributes', () => {
    render(<SearchInput {...defaultProps} isOpen={true} />)
    const input = screen.getByRole('combobox')
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(input).toHaveAttribute('aria-controls', 'search-results')
    expect(input).toHaveAttribute('aria-autocomplete', 'list')
  })

  it('sets aria-expanded to false when closed', () => {
    render(<SearchInput {...defaultProps} isOpen={false} />)
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false')
  })

  it('has minimum 44px touch target height', () => {
    render(<SearchInput {...defaultProps} />)
    const input = screen.getByRole('combobox')
    // h-11 = 44px = 2.75rem
    expect(input.className).toContain('h-11')
  })
})
