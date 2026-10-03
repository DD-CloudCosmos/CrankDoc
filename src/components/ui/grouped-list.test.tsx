import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GroupedList, ListRow, IconTile } from './grouped-list'

describe('GroupedList', () => {
  it('renders header, rows and footer', () => {
    render(
      <GroupedList header="Expected readings" footer="Measured at the battery">
        <ListRow label="Healthy" detail="12.6 V" />
      </GroupedList>
    )
    expect(screen.getByRole('heading', { name: 'Expected readings' })).toBeInTheDocument()
    expect(screen.getByText('Healthy')).toBeInTheDocument()
    expect(screen.getByText('12.6 V')).toBeInTheDocument()
    expect(screen.getByText('Measured at the battery')).toBeInTheDocument()
  })

  it('renders without header or footer', () => {
    render(
      <GroupedList>
        <ListRow label="Only row" />
      </GroupedList>
    )
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(screen.getByText('Only row')).toBeInTheDocument()
  })
})

describe('ListRow', () => {
  it('renders as a link with a chevron when href is given', () => {
    const { container } = render(<ListRow label="Won't start" href="/diagnose/abc" />)
    const link = screen.getByRole('link', { name: /won't start/i })
    expect(link).toHaveAttribute('href', '/diagnose/abc')
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders as a button and calls onClick', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<ListRow label="Below 12.0 V" onClick={onClick} />)
    await user.click(screen.getByRole('button', { name: /below 12.0 v/i }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('renders as plain row without link or button', () => {
    render(<ListRow label="Drain plug" detail="43 Nm" />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('43 Nm')).toBeInTheDocument()
  })

  it('shows subtitle, leading and trailing content', () => {
    render(
      <ListRow
        label="R 1250 GS"
        subtitle="BMW"
        leading={<span>lead</span>}
        trailing={<span>check</span>}
        onClick={() => {}}
      />
    )
    expect(screen.getByText('BMW')).toBeInTheDocument()
    expect(screen.getByText('lead')).toBeInTheDocument()
    expect(screen.getByText('check')).toBeInTheDocument()
  })

  it('hides chevron when trailing content is provided', () => {
    const { container } = render(<ListRow label="Row" href="/x" trailing={<span>t</span>} />)
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })

  it('can force-hide the chevron on links', () => {
    const { container } = render(<ListRow label="Row" href="/x" chevron={false} />)
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })
})

describe('IconTile', () => {
  it('renders children and is hidden from screen readers', () => {
    const { container } = render(<IconTile className="bg-safe">i</IconTile>)
    const tile = container.firstChild as HTMLElement
    expect(tile).toHaveAttribute('aria-hidden', 'true')
    expect(tile).toHaveClass('bg-safe')
    expect(tile).toHaveTextContent('i')
  })
})
