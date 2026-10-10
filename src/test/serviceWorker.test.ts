import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'

/**
 * Runs public/sw.js in a sandbox with fake `self`, `fetch` and `caches`,
 * then drives its fetch handler to check the caching strategy per request.
 */
type Handler = (event: unknown) => void

function loadServiceWorker() {
  const listeners: Record<string, Handler> = {}
  const cache = { put: vi.fn(), addAll: vi.fn() }
  const caches = {
    open: vi.fn(async () => cache),
    match: vi.fn(async () => 'cached-response'),
    keys: vi.fn(async () => []),
    delete: vi.fn(),
  }
  const fetchMock = vi.fn()
  const sandbox = {
    self: { addEventListener: (type: string, fn: Handler) => (listeners[type] = fn), clients: { claim: vi.fn() } },
    caches,
    fetch: fetchMock,
    URL,
    Promise,
  }
  const source = fs.readFileSync(path.join(process.cwd(), 'public/sw.js'), 'utf8')
  vm.runInNewContext(source, sandbox)

  async function dispatchFetch(url: string, mode = 'no-cors') {
    let responded: Promise<unknown> | undefined
    listeners.fetch({ request: { url, mode }, respondWith: (p: Promise<unknown>) => (responded = p) })
    return responded
  }

  return { listeners, caches, cache, fetchMock, dispatchFetch, source }
}

const okResponse = { ok: true, clone: () => 'clone' }

describe('service worker', () => {
  let sw: ReturnType<typeof loadServiceWorker>

  beforeEach(() => {
    sw = loadServiceWorker()
  })

  it('uses a cache version newer than the pre-makeover cache', () => {
    expect(sw.source).toContain("const CACHE_NAME = 'crankdoc-v4'")
  })

  it('serves page navigations from the network first and caches them', async () => {
    sw.fetchMock.mockResolvedValue(okResponse)
    const response = await sw.dispatchFetch('https://crankdoc.app/', 'navigate')
    expect(response).toBe(okResponse)
    expect(sw.caches.match).not.toHaveBeenCalled()
    await Promise.resolve()
    expect(sw.cache.put).toHaveBeenCalled()
  })

  it('falls back to the cached page when offline', async () => {
    sw.fetchMock.mockRejectedValue(new Error('offline'))
    const response = await sw.dispatchFetch('https://crankdoc.app/bikes', 'navigate')
    expect(response).toBe('cached-response')
  })

  it('keeps cache-first for static (non-navigation) assets', async () => {
    const response = await sw.dispatchFetch('https://crankdoc.app/icons/icon-192.png')
    expect(response).toBe('cached-response')
    expect(sw.fetchMock).not.toHaveBeenCalled()
  })

  it('uses network-first for guide pages and the DTC API', async () => {
    sw.fetchMock.mockResolvedValue(okResponse)
    expect(await sw.dispatchFetch('https://crankdoc.app/diagnose/abc')).toBe(okResponse)
    expect(await sw.dispatchFetch('https://crankdoc.app/api/dtc?q=P0107')).toBe(okResponse)
  })
})
