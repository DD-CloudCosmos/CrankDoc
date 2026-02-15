import { describe, it, expect } from 'vitest'
import { generateWebApplicationSchema } from './structuredData'

describe('generateWebApplicationSchema', () => {
  it('returns a valid WebApplication schema object', () => {
    const schema = generateWebApplicationSchema()

    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('WebApplication')
    expect(schema.name).toBe('CrankDoc')
    expect(schema.url).toBe('https://crankdoc.vercel.app')
  })

  it('includes application category and operating system', () => {
    const schema = generateWebApplicationSchema()

    expect(schema.applicationCategory).toBe('UtilityApplication')
    expect(schema.operatingSystem).toBe('Any')
  })

  it('includes a free offer', () => {
    const schema = generateWebApplicationSchema()

    expect(schema.offers).toEqual({
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    })
  })
})
