import { expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Page from './page'

it('shows the bike reference and both correctly labelled factory diagrams', async () => {
  const user = userEvent.setup()
  render(<Page />)
  expect(screen.getByRole('heading', { name: 'Honda CB1000R' })).toBeInTheDocument()
  expect(screen.getByText(/ABS equipment is unconfirmed/)).toBeInTheDocument()
  await user.click(screen.getByRole('tab', { name: 'Wiring' }))
  expect(screen.getByAltText('CB1000R - non-ABS (22-3)')).toBeInTheDocument()
  expect(screen.getByAltText('CB1000RA - ABS (22-4)')).toBeInTheDocument()
})
