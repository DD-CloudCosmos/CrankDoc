/**
 * Web Scraper
 *
 * Fetches HTML content from URLs with retry logic, rate limiting,
 * and proper User-Agent identification.
 *
 * For Wikipedia sources, uses the MediaWiki parse API to get clean
 * article HTML without site chrome. For other sources, fetches the
 * page directly.
 *
 * Follows the retry pattern from nhtsaClient.ts (3 attempts with
 * exponential backoff: 500ms, 1000ms, 2000ms).
 */

import type { FetchResult, SourceConfig } from './scraper.types'

const USER_AGENT = 'CrankDoc/1.0 (motorcycle diagnostic app)'
const MAX_RETRIES = 3
const BACKOFF_MS = [500, 1000, 2000]

/**
 * Fetches page content for a source. Routes to the appropriate fetcher
 * based on the source type.
 */
export async function fetchPageContent(
  source: SourceConfig
): Promise<FetchResult> {
  if (source.sourceType === 'wikipedia' && source.wikiPageTitle) {
    return fetchWikipediaArticle(source.wikiPageTitle)
  }
  return fetchGenericPage(source.url)
}

/**
 * Fetches a Wikipedia article via the MediaWiki parse API.
 *
 * Returns only the article body HTML (no site chrome, navbars, footers).
 * Uses the same API endpoint and User-Agent pattern as
 * scripts/fetch-wiki-images.js.
 */
export async function fetchWikipediaArticle(
  pageTitle: string
): Promise<FetchResult> {
  const apiUrl =
    `https://en.wikipedia.org/w/api.php?action=parse` +
    `&page=${encodeURIComponent(pageTitle)}` +
    `&prop=text|displaytitle` +
    `&format=json`

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(apiUrl, {
        headers: { 'User-Agent': USER_AGENT },
      })

      if (!response.ok) {
        throw new Error(`Wikipedia API returned status ${response.status}`)
      }

      const data = (await response.json()) as WikipediaApiResponse

      if (data.error) {
        throw new Error(`Wikipedia API error: ${data.error.info}`)
      }

      const html = data.parse.text['*']
      const displayTitle = data.parse.displaytitle.replace(/<[^>]+>/g, '')

      return {
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`,
        html,
        title: displayTitle,
        statusCode: response.status,
        contentLength: html.length,
        fetchedAt: new Date().toISOString(),
      }
    } catch (error) {
      if (attempt < MAX_RETRIES - 1) {
        await delay(BACKOFF_MS[attempt])
      } else {
        throw new Error(
          `Failed to fetch Wikipedia article "${pageTitle}" after ${MAX_RETRIES} attempts: ` +
            (error instanceof Error ? error.message : String(error))
        )
      }
    }
  }

  // TypeScript needs this (unreachable after the throw above)
  throw new Error('Unexpected: all retries exhausted')
}

/**
 * Fetches a generic web page with retry logic.
 */
export async function fetchGenericPage(url: string): Promise<FetchResult> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`)
      }

      const html = await response.text()

      // Try to extract <title> for the page title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      const title = titleMatch ? titleMatch[1].trim() : url

      return {
        url,
        html,
        title,
        statusCode: response.status,
        contentLength: html.length,
        fetchedAt: new Date().toISOString(),
      }
    } catch (error) {
      if (attempt < MAX_RETRIES - 1) {
        await delay(BACKOFF_MS[attempt])
      } else {
        throw new Error(
          `Failed to fetch "${url}" after ${MAX_RETRIES} attempts: ` +
            (error instanceof Error ? error.message : String(error))
        )
      }
    }
  }

  throw new Error('Unexpected: all retries exhausted')
}

/**
 * Pauses execution for the given number of milliseconds.
 * Used for rate limiting between requests and retry backoff.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Wikipedia API response types
// ---------------------------------------------------------------------------

interface WikipediaApiResponse {
  parse: {
    title: string
    displaytitle: string
    text: { '*': string }
  }
  error?: {
    code: string
    info: string
  }
}
