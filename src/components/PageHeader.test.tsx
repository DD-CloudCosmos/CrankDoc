import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PageHeader, PageContainer } from './PageHeader'

describe('PageHeader', () => {
  it('renders the title as the page h1 with subtitle and eyebrow', () => {
    render(<PageHeader title="Fault Codes" subtitle="664 codes" eyebrow="Lookup" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Fault Codes' })).toBeInTheDocument()
    expect(screen.getByText('664 codes')).toBeInTheDocument()
    expect(screen.getByText('Lookup')).toBeInTheDocument()
  })

  it('renders actions when given', () => {
    render(<PageHeader title="Bikes" actions={<button type="button">Grid</button>} />)
    expect(screen.getByRole('button', { name: 'Grid' })).toBeInTheDocument()
  })

  it('omits optional parts', () => {
    const { container } = render(<PageHeader title="Only title" />)
    expect(container.querySelectorAll('p')).toHaveLength(0)
  })
})

describe('PageContainer', () => {
  it('uses the wide layout by default and a reading width when narrow', () => {
    const { rerender, container } = render(<PageContainer>x</PageContainer>)
    expect(container.firstChild).toHaveClass('max-w-[1024px]')
    rerender(<PageContainer narrow>x</PageContainer>)
    expect(container.firstChild).toHaveClass('max-w-[720px]')
  })
})
