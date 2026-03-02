import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  fetchWikipediaArticle,
  fetchGenericPage,
  fetchPageContent,
  delay,
} from './webScraper'

// Mock global fetch
const mockFetch = vi.fn()

beforeEach(() => {
  mockFetch.mockReset()
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockJsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  }
}

function mockTextResponse(html: string, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(html),
  }
}

const WIKIPEDIA_SUCCESS_RESPONSE = {
  parse: {
    title: 'Honda CBR600RR',
    displaytitle: 'Honda CBR600RR',
    text: { '*': '<table class="infobox"><tr><th>Engine</th><td>599 cc</td></tr></table>' },
  },
}

// ---------------------------------------------------------------------------
// fetchWikipediaArticle
// ---------------------------------------------------------------------------

describe('fetchWikipediaArticle', () => {
  it('fetches and extracts article HTML from Wikipedia API', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse(WIKIPEDIA_SUCCESS_RESPONSE))

    const result = await fetchWikipediaArticle('Honda_CBR600RR')

    expect(result.html).toContain('599 cc')
    expect(result.title).toBe('Honda CBR600RR')
    expect(result.statusCode).toBe(200)
    expect(result.contentLength).toBeGreaterThan(0)
    expect(result.fetchedAt).toBeTruthy()
  })

  it('sends correct User-Agent header', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse(WIKIPEDIA_SUCCESS_RESPONSE))

    await fetchWikipediaArticle('Honda_CBR600RR')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('api.php?action=parse'),
      expect.objectContaining({
        headers: { 'User-Agent': 'CrankDoc/1.0 (motorcycle diagnostic app)' },
      })
    )
  })

  it('calls Wikipedia parse API with correct page title', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse(WIKIPEDIA_SUCCESS_RESPONSE))

    await fetchWikipediaArticle('Honda_CBR600RR')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('page=Honda_CBR600RR'),
      expect.anything()
    )
  })

  it('retries on network failure with exponential backoff', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockJsonResponse(WIKIPEDIA_SUCCESS_RESPONSE))

    const result = await fetchWikipediaArticle('Honda_CBR600RR')

    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(result.title).toBe('Honda CBR600RR')
  })

  it('throws after exhausting all retries', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    await expect(fetchWikipediaArticle('Honda_CBR600RR')).rejects.toThrow(
      /Failed to fetch Wikipedia article.*after 3 attempts/
    )
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('throws on Wikipedia API error response', async () => {
    mockFetch.mockResolvedValue(
      mockJsonResponse({
        error: { code: 'missingtitle', info: 'The page you specified does not exist.' },
      })
    )

    await expect(fetchWikipediaArticle('Nonexistent_Page')).rejects.toThrow(
      /Failed to fetch Wikipedia article/
    )
  })

  it('retries on non-ok HTTP status', async () => {
    mockFetch
      .mockResolvedValueOnce(mockJsonResponse({}, 500))
      .mockResolvedValueOnce(mockJsonResponse(WIKIPEDIA_SUCCESS_RESPONSE))

    const result = await fetchWikipediaArticle('Honda_CBR600RR')
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(result.title).toBe('Honda CBR600RR')
  })

  it('strips HTML tags from display title', async () => {
    const response = {
      parse: {
        title: 'Test',
        displaytitle: '<i>Honda</i> CBR600RR',
        text: { '*': '<p>Content</p>' },
      },
    }
    mockFetch.mockResolvedValueOnce(mockJsonResponse(response))

    const result = await fetchWikipediaArticle('Honda_CBR600RR')
    expect(result.title).toBe('Honda CBR600RR')
  })
})

// ---------------------------------------------------------------------------
// fetchGenericPage
// ---------------------------------------------------------------------------

describe('fetchGenericPage', () => {
  it('fetches HTML from a generic URL', async () => {
    const html = '<html><head><title>Kymco AK 550</title></head><body><p>Specs</p></body></html>'
    mockFetch.mockResolvedValueOnce(mockTextResponse(html))

    const result = await fetchGenericPage('https://example.com/kymco')

    expect(result.html).toContain('Specs')
    expect(result.title).toBe('Kymco AK 550')
    expect(result.statusCode).toBe(200)
  })

  it('falls back to URL as title when no <title> tag', async () => {
    mockFetch.mockResolvedValueOnce(mockTextResponse('<p>No title</p>'))

    const result = await fetchGenericPage('https://example.com/page')
    expect(result.title).toBe('https://example.com/page')
  })

  it('retries on failure', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('Connection reset'))
      .mockResolvedValueOnce(mockTextResponse('<p>Success</p>'))

    const result = await fetchGenericPage('https://example.com')
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(result.html).toContain('Success')
  })

  it('throws after all retries fail', async () => {
    mockFetch.mockRejectedValue(new Error('Timeout'))

    await expect(fetchGenericPage('https://example.com')).rejects.toThrow(
      /Failed to fetch.*after 3 attempts/
    )
  })
})

// ---------------------------------------------------------------------------
// fetchPageContent
// ---------------------------------------------------------------------------

describe('fetchPageContent', () => {
  it('routes wikipedia sources to fetchWikipediaArticle', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse(WIKIPEDIA_SUCCESS_RESPONSE))

    const result = await fetchPageContent({
      url: 'https://en.wikipedia.org/wiki/Honda_CBR600RR',
      sourceType: 'wikipedia',
      label: 'Wikipedia - Honda CBR600RR',
      wikiPageTitle: 'Honda_CBR600RR',
    })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('api.php?action=parse'),
      expect.anything()
    )
    expect(result.title).toBe('Honda CBR600RR')
  })

  it('routes non-wikipedia sources to fetchGenericPage', async () => {
    mockFetch.mockResolvedValueOnce(
      mockTextResponse('<html><head><title>Kymco</title></head><body>Specs</body></html>')
    )

    const result = await fetchPageContent({
      url: 'https://www.kymco.com/models/ak-550',
      sourceType: 'manufacturer',
      label: 'Kymco - AK 550',
    })

    expect(mockFetch).toHaveBeenCalledWith(
      'https://www.kymco.com/models/ak-550',
      expect.anything()
    )
    expect(result.title).toBe('Kymco')
  })
})

// ---------------------------------------------------------------------------
// delay
// ---------------------------------------------------------------------------

describe('delay', () => {
  it('resolves after the specified time', async () => {
    vi.useFakeTimers()

    const promise = delay(1000)
    vi.advanceTimersByTime(1000)
    await promise

    vi.useRealTimers()
  })
})
