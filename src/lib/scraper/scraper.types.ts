/**
 * Scraper Types
 *
 * Shared type definitions for the web scraping pipeline that fetches
 * publicly available motorcycle specs and technical data.
 */

/** Configuration for a single bike's scrape sources. */
export interface BikeConfig {
  make: string
  model: string
  yearStart: number
  yearEnd: number | null
  category: string
  sources: SourceConfig[]
}

/** A single URL source to scrape for a bike. */
export interface SourceConfig {
  url: string
  sourceType: 'wikipedia' | 'manufacturer' | 'spec_database'
  /** Human-readable label (e.g., "Wikipedia - Honda CBR600RR") */
  label: string
  /** Wikipedia page title for API usage (only for sourceType 'wikipedia') */
  wikiPageTitle?: string
}

/** Result of fetching a single URL. */
export interface FetchResult {
  url: string
  html: string
  title: string
  statusCode: number
  contentLength: number
  fetchedAt: string
}

/** A section extracted from a parsed page. */
export interface ParsedSection {
  heading: string
  content: string
  level: number
}

/** Result of parsing a scraped page into structured text. */
export interface ScrapeResult {
  bike: BikeConfig
  source: SourceConfig
  title: string
  fullText: string
  sections: ParsedSection[]
  fetchedAt: string
}

/** Options for the CLI scrape script. */
export interface ScrapeOptions {
  /** Bike slugs to process, or ['all'] for all bikes */
  bikes: string[]
  /** Skip deduplication check and re-scrape */
  force: boolean
  /** Fetch and parse but don't embed or store */
  dryRun: boolean
  /** Delay between requests in ms */
  delayMs: number
  /** Detailed logging */
  verbose: boolean
}
