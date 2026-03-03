// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isUrlAllowed, clearRobotsCache } from './robotsChecker'

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function mockRobotsTxt(text: string) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    text: async () => text,
  })
}

function mockFetchFailure() {
  mockFetch.mockRejectedValueOnce(new Error('Network error'))
}

function mockFetch404() {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status: 404,
  })
}

describe('robotsChecker', () => {
  beforeEach(() => {
    clearRobotsCache()
    mockFetch.mockReset()
  })

  it('allows URL when no matching disallow rule', async () => {
    mockRobotsTxt(`
User-agent: *
Disallow: /admin/
Disallow: /private/
    `)

    const allowed = await isUrlAllowed('https://example.com/model/honda.html')
    expect(allowed).toBe(true)
  })

  it('disallows URL when Disallow matches path', async () => {
    mockRobotsTxt(`
User-agent: *
Disallow: /admin/
Disallow: /model/
    `)

    const allowed = await isUrlAllowed('https://example.com/model/honda.html')
    expect(allowed).toBe(false)
  })

  it('Allow directive overrides Disallow', async () => {
    mockRobotsTxt(`
User-agent: *
Disallow: /model/
Allow: /model/honda
    `)

    const allowed = await isUrlAllowed('https://example.com/model/honda.html')
    expect(allowed).toBe(true)
  })

  it('CrankDoc-specific rules take priority over wildcard', async () => {
    mockRobotsTxt(`
User-agent: *
Disallow: /

User-agent: CrankDoc
Allow: /model/
    `)

    const allowed = await isUrlAllowed('https://example.com/model/honda.html')
    expect(allowed).toBe(true)
  })

  it('returns true when robots.txt fetch fails', async () => {
    mockFetchFailure()

    const allowed = await isUrlAllowed('https://example.com/some-page')
    expect(allowed).toBe(true)
  })

  it('returns true when robots.txt returns 404', async () => {
    mockFetch404()

    const allowed = await isUrlAllowed('https://example.com/some-page')
    expect(allowed).toBe(true)
  })

  it('caches robots.txt per domain (fetch called once)', async () => {
    mockRobotsTxt(`
User-agent: *
Disallow: /private/
    `)

    await isUrlAllowed('https://example.com/page-1')
    await isUrlAllowed('https://example.com/page-2')

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('clearRobotsCache resets the cache', async () => {
    mockRobotsTxt(`
User-agent: *
Disallow: /private/
    `)

    await isUrlAllowed('https://example.com/page-1')
    expect(mockFetch).toHaveBeenCalledTimes(1)

    clearRobotsCache()

    mockRobotsTxt(`
User-agent: *
Disallow: /private/
    `)

    await isUrlAllowed('https://example.com/page-2')
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('fetches different robots.txt for different domains', async () => {
    mockRobotsTxt(`
User-agent: *
Disallow:
    `)
    mockRobotsTxt(`
User-agent: *
Disallow: /
    `)

    const allowed1 = await isUrlAllowed('https://site-a.com/page')
    const allowed2 = await isUrlAllowed('https://site-b.com/page')

    expect(allowed1).toBe(true)
    expect(allowed2).toBe(false)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})
