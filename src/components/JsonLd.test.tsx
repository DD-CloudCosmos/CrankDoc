import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { JsonLd } from './JsonLd'

describe('JsonLd', () => {
  it('renders a script tag with type application/ld+json', () => {
    const data = { '@type': 'WebApplication', name: 'Test' }
    const { container } = render(<JsonLd data={data} />)

    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).not.toBeNull()
  })

  it('contains the serialized JSON data', () => {
    const data = { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'CrankDoc' }
    const { container } = render(<JsonLd data={data} />)

    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script?.innerHTML).toBe(JSON.stringify(data))
  })
})
