/**
 * Headless Fetcher
 *
 * Uses Playwright to fetch JavaScript-rendered pages from manufacturer sites
 * that block simple HTTP requests. Falls back to standard fetch() if Playwright
 * is not available or the page loads without JS.
 *
 * Playwright is a devDependency — it's only needed for the scrape pipeline,
 * not for the Next.js app itself.
 */

import type { FetchResult } from './scraper.types'

const USER_AGENT = 'CrankDoc/1.0 (motorcycle diagnostic app)'

/**
 * Fetches a page using Playwright headless browser.
 * Waits for the page to fully render (networkidle), then extracts HTML.
 *
 * Falls back to standard fetch() if Playwright import fails.
 */
export async function fetchWithHeadless(url: string): Promise<FetchResult> {
  try {
    return await fetchWithPlaywright(url)
  } catch (error) {
    // If Playwright fails (not installed, browser not found, etc.),
    // fall back to standard fetch
    const isPlaywrightError =
      error instanceof Error &&
      (error.message.includes('Cannot find module') ||
        error.message.includes('browserType.launch') ||
        error.message.includes('Executable doesn'))

    if (isPlaywrightError) {
      console.warn('  Playwright unavailable, falling back to standard fetch')
      return fetchWithStandardFetch(url)
    }

    throw error
  }
}

/**
 * Fetches a page using Playwright's Chromium headless browser.
 */
async function fetchWithPlaywright(url: string): Promise<FetchResult> {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch({ headless: true, channel: 'chrome' })

  try {
    const context = await browser.newContext({
      userAgent: USER_AGENT,
    })
    const page = await context.newPage()

    const response = await page.goto(url, {
      waitUntil: 'load',
      timeout: 30000,
    })

    // Give JS frameworks a moment to render content after page load
    await page.waitForTimeout(3000)

    const statusCode = response?.status() ?? 0
    if (statusCode >= 400) {
      throw new Error(`HTTP ${statusCode} for ${url}`)
    }

    const html = await page.content()
    const title = await page.title()

    return {
      url,
      html,
      title,
      statusCode,
      contentLength: html.length,
      fetchedAt: new Date().toISOString(),
    }
  } finally {
    await browser.close()
  }
}

/**
 * Standard fetch fallback when Playwright is unavailable.
 */
async function fetchWithStandardFetch(url: string): Promise<FetchResult> {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`)
  }

  const html = await response.text()
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
}
