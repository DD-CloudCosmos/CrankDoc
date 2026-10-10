import { expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Page from './page'

it('shows the 2023 European ABS model and verified searchable sections', () => {
  render(<Page />)
  expect(screen.getByRole('heading', { name: 'Honda CB650RA' })).toBeInTheDocument()
  expect(screen.getByAltText(/2023 Honda CB650RA reference illustration/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Honda 2023 owner’s manual' })).toHaveAttribute('href', 'https://www.hondamotopub.com/om/HMEE/CB650R/2023')
  expect(screen.queryByRole('tab', { name: 'Wiring' })).not.toBeInTheDocument()
  expect(screen.getByText('Curb weight')).toBeInTheDocument()
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'gear ratios' } })
  expect(screen.getByText('3.071')).toBeInTheDocument()
  expect(screen.getByText('1.214')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('tab', { name: 'Service' }))
  expect(screen.getByText('Before every ride')).toBeInTheDocument()
  expect(screen.getByText('Every 36,000 km')).toBeInTheDocument()
  expect(screen.getByText('Every 36 months')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Miles' }))
  expect(screen.getByText('At 600 miles')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Expand all' }))
  expect(screen.getByText('Schedule notes').closest('details')).toHaveAttribute('open')
  fireEvent.click(screen.getByRole('tab', { name: 'Fluids' }))
  expect(screen.getByRole('searchbox', { name: 'Search fluids' })).toBeInTheDocument()
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: '2.6' } })
  expect(screen.getByText('Engine Oil').closest('details')).toHaveAttribute('open')
  expect(screen.getByText(/2.3 L after draining; 2.6 L with filter/)).toBeInTheDocument()
  expect(screen.queryByText('Clutch Fluid')).not.toBeInTheDocument()
})
