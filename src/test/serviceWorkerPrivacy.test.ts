// @vitest-environment node
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { expect, it, vi } from 'vitest'
const script = readFileSync('public/sw.js', 'utf8')
for (const root of ['/garage', '/account', '/auth', '/api/garage']) {
  for (const mode of ['navigate', 'cors']) {
    it(`never caches or restores offline private ${root} requests (${mode})`, async () => {
      const handlers: Record<string, (event: unknown) => void> = {}
      const cache = { put: vi.fn(), addAll: vi.fn() }
      const caches = { match: vi.fn(async () => undefined), open: vi.fn(async () => cache) }
      const fetch = vi.fn().mockRejectedValue(new Error('offline'))
      runInNewContext(script, { self: { addEventListener: (name: string, handler: (event: unknown) => void) => { handlers[name] = handler } }, caches, fetch, URL })
      let response: Promise<unknown> | undefined
      handlers.fetch({ request: { url: `https://example.test${root}/child?_rsc=123`, mode, headers: { 'Next-Router-Prefetch': '1' } }, respondWith: (value: Promise<unknown>) => { response = value } })
      await expect(response).rejects.toThrow('offline')
      expect(caches.match).not.toHaveBeenCalled()
      expect(caches.open).not.toHaveBeenCalled()
      expect(cache.put).not.toHaveBeenCalled()
    })
  }
}
it('keeps public navigation available offline', async () => {
  const handlers: Record<string, (event: unknown) => void> = {}
  const cached = { public: true }
  const caches = { match: vi.fn(async () => cached) }
  runInNewContext(script, { self: { addEventListener: (name: string, handler: (event: unknown) => void) => { handlers[name] = handler } }, caches, fetch: vi.fn().mockRejectedValue(new Error('offline')), URL })
  let response: Promise<unknown> | undefined
  handlers.fetch({ request: { url: 'https://example.test/', mode: 'navigate' }, respondWith: (value: Promise<unknown>) => { response = value } })
  expect(await response).toBe(cached)
})
