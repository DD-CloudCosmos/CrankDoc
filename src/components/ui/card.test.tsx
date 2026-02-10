import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card'

describe('Card', () => {
  it('renders the card with content', () => {
    render(<Card>Card content</Card>)
    expect(screen.getByText(/card content/i)).toBeInTheDocument()
  })

  it('applies default styling classes', () => {
    const { container } = render(<Card>Test</Card>)
    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('rounded-xl', 'border', 'border-zinc-800', 'bg-zinc-900')
  })

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class">Test</Card>)
    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('custom-class')
  })
})

describe('CardHeader', () => {
  it('renders the header with content', () => {
    render(<CardHeader>Header content</CardHeader>)
    expect(screen.getByText(/header content/i)).toBeInTheDocument()
  })

  it('applies default styling classes', () => {
    const { container } = render(<CardHeader>Test</CardHeader>)
    const header = container.firstChild as HTMLElement
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6')
  })

  it('applies custom className', () => {
    const { container } = render(<CardHeader className="custom-class">Test</CardHeader>)
    const header = container.firstChild as HTMLElement
    expect(header).toHaveClass('custom-class')
  })
})

describe('CardTitle', () => {
  it('renders the title with content', () => {
    render(<CardTitle>Title content</CardTitle>)
    expect(screen.getByText(/title content/i)).toBeInTheDocument()
  })

  it('applies default styling classes', () => {
    const { container } = render(<CardTitle>Test</CardTitle>)
    const title = container.firstChild as HTMLElement
    expect(title).toHaveClass('font-semibold', 'leading-none', 'tracking-tight')
  })

  it('applies custom className', () => {
    const { container } = render(<CardTitle className="custom-class">Test</CardTitle>)
    const title = container.firstChild as HTMLElement
    expect(title).toHaveClass('custom-class')
  })
})

describe('CardDescription', () => {
  it('renders the description with content', () => {
    render(<CardDescription>Description content</CardDescription>)
    expect(screen.getByText(/description content/i)).toBeInTheDocument()
  })

  it('applies default styling classes', () => {
    const { container } = render(<CardDescription>Test</CardDescription>)
    const description = container.firstChild as HTMLElement
    expect(description).toHaveClass('text-sm', 'text-zinc-400')
  })

  it('applies custom className', () => {
    const { container } = render(<CardDescription className="custom-class">Test</CardDescription>)
    const description = container.firstChild as HTMLElement
    expect(description).toHaveClass('custom-class')
  })
})

describe('CardContent', () => {
  it('renders the content', () => {
    render(<CardContent>Card body content</CardContent>)
    expect(screen.getByText(/card body content/i)).toBeInTheDocument()
  })

  it('applies default styling classes', () => {
    const { container } = render(<CardContent>Test</CardContent>)
    const content = container.firstChild as HTMLElement
    expect(content).toHaveClass('p-6', 'pt-0')
  })

  it('applies custom className', () => {
    const { container } = render(<CardContent className="custom-class">Test</CardContent>)
    const content = container.firstChild as HTMLElement
    expect(content).toHaveClass('custom-class')
  })
})

describe('CardFooter', () => {
  it('renders the footer with content', () => {
    render(<CardFooter>Footer content</CardFooter>)
    expect(screen.getByText(/footer content/i)).toBeInTheDocument()
  })

  it('applies default styling classes', () => {
    const { container } = render(<CardFooter>Test</CardFooter>)
    const footer = container.firstChild as HTMLElement
    expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0')
  })

  it('applies custom className', () => {
    const { container } = render(<CardFooter className="custom-class">Test</CardFooter>)
    const footer = container.firstChild as HTMLElement
    expect(footer).toHaveClass('custom-class')
  })
})

describe('Card composition', () => {
  it('renders a complete card with all sub-components', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
        <CardContent>Test Content</CardContent>
        <CardFooter>Test Footer</CardFooter>
      </Card>
    )

    expect(screen.getByText(/test title/i)).toBeInTheDocument()
    expect(screen.getByText(/test description/i)).toBeInTheDocument()
    expect(screen.getByText(/test content/i)).toBeInTheDocument()
    expect(screen.getByText(/test footer/i)).toBeInTheDocument()
  })
})
