// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchWithHeadless } from './headlessFetcher'

// Mock playwright
vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn(),
  },
}))

// Mock global fetch for fallback tests
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('headlessFetcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches page with Playwright and returns FetchResult', async () => {
    const { chromium } = await import('playwright')
    const mockPage = {
      goto: vi.fn().mockResolvedValue({ status: () => 200 }),
      content: vi.fn().mockResolvedValue('<html><body>Hello</body></html>'),
      title: vi.fn().mockResolvedValue('Test Page'),
      waitForTimeout: vi.fn().mockResolvedValue(undefined),
    }
    const mockContext = {
      newPage: vi.fn().mockResolvedValue(mockPage),
    }
    const mockBrowser = {
      newContext: vi.fn().mockResolvedValue(mockContext),
      close: vi.fn().mockResolvedValue(undefined),
    }

    vi.mocked(chromium.launch).mockResolvedValue(mockBrowser as never)

    const result = await fetchWithHeadless('https://example.com/page')

    expect(result.url).toBe('https://example.com/page')
    expect(result.html).toContain('Hello')
    expect(result.title).toBe('Test Page')
    expect(result.statusCode).toBe(200)
    expect(result.contentLength).toBeGreaterThan(0)
    expect(result.fetchedAt).toBeTruthy()
    expect(mockBrowser.close).toHaveBeenCalled()
  })

  it('throws on HTTP error status', async () => {
    const { chromium } = await import('playwright')
    const mockPage = {
      goto: vi.fn().mockResolvedValue({ status: () => 403 }),
      content: vi.fn(),
      title: vi.fn(),
      waitForTimeout: vi.fn().mockResolvedValue(undefined),
    }
    const mockContext = {
      newPage: vi.fn().mockResolvedValue(mockPage),
    }
    const mockBrowser = {
      newContext: vi.fn().mockResolvedValue(mockContext),
      close: vi.fn().mockResolvedValue(undefined),
    }

    vi.mocked(chromium.launch).mockResolvedValue(mockBrowser as never)

    await expect(fetchWithHeadless('https://example.com/blocked')).rejects.toThrow(
      'HTTP 403'
    )
    expect(mockBrowser.close).toHaveBeenCalled()
  })

  it('falls back to standard fetch when Playwright is unavailable', async () => {
    const { chromium } = await import('playwright')

    vi.mocked(chromium.launch).mockRejectedValue(
      new Error('Cannot find module playwright')
    )

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '<html><head><title>Fallback Page</title></head><body>content</body></html>',
    })

    const result = await fetchWithHeadless('https://example.com/fallback')

    expect(result.title).toBe('Fallback Page')
    expect(result.statusCode).toBe(200)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('closes browser even when page errors', async () => {
    const { chromium } = await import('playwright')
    const mockPage = {
      goto: vi.fn().mockRejectedValue(new Error('Navigation timeout')),
    }
    const mockContext = {
      newPage: vi.fn().mockResolvedValue(mockPage),
    }
    const mockBrowser = {
      newContext: vi.fn().mockResolvedValue(mockContext),
      close: vi.fn().mockResolvedValue(undefined),
    }

    vi.mocked(chromium.launch).mockResolvedValue(mockBrowser as never)

    await expect(fetchWithHeadless('https://example.com/timeout')).rejects.toThrow(
      'Navigation timeout'
    )
    expect(mockBrowser.close).toHaveBeenCalled()
  })
})
