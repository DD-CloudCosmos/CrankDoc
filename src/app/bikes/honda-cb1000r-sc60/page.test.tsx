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

it('onboards the bike with a real photo, schedule, precise fluids and source links', async () => {
  const user = userEvent.setup()
  render(<Page />)
  expect(screen.getByAltText(/SC60 reference motorcycle/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'CC BY-SA 3.0' })).toHaveAttribute('href', 'https://creativecommons.org/licenses/by-sa/3.0/')
  expect(screen.getByText(/77 kW/)).toBeInTheDocument()
  expect(screen.getByText('Curb weight')).toBeInTheDocument()
  await user.click(screen.getByRole('tab', { name: 'Service' }))
  expect(screen.getByText('First service (one-off)')).toBeInTheDocument()
  expect(screen.getByText('Spark plug replacement')).toBeInTheDocument()
  await user.click(screen.getByRole('tab', { name: 'Fluids' }))
  expect(screen.getByText(/3.0 L with filter/)).toBeInTheDocument()
  expect(screen.getByText(/CB1000R 511.*CB1000RA 542/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Factory service manual' })).toHaveAttribute('href', '/manuals/honda-cb1000r-2008.pdf')
})
