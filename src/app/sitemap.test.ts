import { describe, it, expect } from 'vitest'
import sitemap from './sitemap'

describe('sitemap', () => {
  it('returns an array of sitemap entries', () => {
    const entries = sitemap()
    expect(Array.isArray(entries)).toBe(true)
    expect(entries.length).toBeGreaterThan(0)
  })

  it('includes all main routes', () => {
    const entries = sitemap()
    const urls = entries.map((entry) => entry.url)

    expect(urls).toContain('https://crankdoc.vercel.app')
    expect(urls).toContain('https://crankdoc.vercel.app/diagnose')
    expect(urls).toContain('https://crankdoc.vercel.app/bikes')
    expect(urls).toContain('https://crankdoc.vercel.app/dtc')
    expect(urls).toContain('https://crankdoc.vercel.app/vin')
  })

  it('has valid priority values between 0 and 1', () => {
    const entries = sitemap()

    for (const entry of entries) {
      expect(entry.priority).toBeGreaterThanOrEqual(0)
      expect(entry.priority).toBeLessThanOrEqual(1)
    }
  })

  it('has the home page with highest priority', () => {
    const entries = sitemap()
    const home = entries.find((e) => e.url === 'https://crankdoc.vercel.app')

    expect(home).toBeDefined()
    expect(home!.priority).toBe(1)
  })

  it('includes lastModified dates', () => {
    const entries = sitemap()

    for (const entry of entries) {
      expect(entry.lastModified).toBeInstanceOf(Date)
    }
  })
})
