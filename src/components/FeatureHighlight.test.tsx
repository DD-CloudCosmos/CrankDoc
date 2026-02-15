import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FeatureHighlight } from './FeatureHighlight'

describe('FeatureHighlight', () => {
  const defaultProps = {
    icon: <svg data-testid="test-icon" />,
    title: 'Test Feature',
    description: 'A test feature description',
    href: '/test',
  }

  it('renders the title', () => {
    render(<FeatureHighlight {...defaultProps} />)
    expect(screen.getByText('Test Feature')).toBeInTheDocument()
  })

  it('renders the description', () => {
    render(<FeatureHighlight {...defaultProps} />)
    expect(screen.getByText('A test feature description')).toBeInTheDocument()
  })

  it('renders the icon', () => {
    render(<FeatureHighlight {...defaultProps} />)
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('links to the correct href', () => {
    render(<FeatureHighlight {...defaultProps} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/test')
  })
})
