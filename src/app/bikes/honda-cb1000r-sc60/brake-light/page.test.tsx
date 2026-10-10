import { expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Page from './page'

it('supports direct Explore entry from the bike Wiring tab', async () => {
  render(await Page({ searchParams: Promise.resolve({ mode: 'explore' }) }))
  expect(screen.getByRole('radio', { name: 'Explore' })).toHaveAttribute('aria-checked', 'true')
  expect(screen.queryByRole('heading', { name: 'Meet the circuit' })).not.toBeInTheDocument()
})
