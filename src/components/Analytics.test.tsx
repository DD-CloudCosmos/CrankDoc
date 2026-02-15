import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'

vi.mock('@vercel/analytics/react', () => ({
  Analytics: () => null,
}))

import { Analytics } from './Analytics'

describe('Analytics', () => {
  it('renders without error', () => {
    const { container } = render(<Analytics />)
    expect(container).toBeDefined()
  })
})
