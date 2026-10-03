import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import DtcPage from './page'

// Mock DtcCodeList since it's tested separately
vi.mock('@/components/DtcCodeList', () => ({
  DtcCodeList: ({ initialQuery }: { initialQuery: string }) => (
    <div data-testid="dtc-code-list" data-initial-query={initialQuery}>DtcCodeList</div>
  ),
}))

describe('DtcPage', () => {
  it('renders the page title', async () => {
    render(await DtcPage({}))
    expect(screen.getByRole('heading', { name: 'Fault Codes', level: 1 })).toBeInTheDocument()
  })

  it('renders the page description with catalogue counts', async () => {
    render(await DtcPage({}))
    expect(screen.getByText(/look up 664 motorcycle fault codes from 11 manufacturers/i)).toBeInTheDocument()
  })

  it('renders the DtcCodeList component without a query by default', async () => {
    render(await DtcPage({}))
    expect(screen.getByTestId('dtc-code-list')).toHaveAttribute('data-initial-query', '')
  })

  it('passes ?q= through as the initial search', async () => {
    render(await DtcPage({ searchParams: Promise.resolve({ q: 'P0107' }) }))
    expect(screen.getByTestId('dtc-code-list')).toHaveAttribute('data-initial-query', 'P0107')
  })

  it('ignores non-string query params', async () => {
    render(await DtcPage({ searchParams: Promise.resolve({ q: ['a', 'b'] }) }))
    expect(screen.getByTestId('dtc-code-list')).toHaveAttribute('data-initial-query', '')
  })
})
