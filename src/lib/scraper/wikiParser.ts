/**
 * Wikipedia HTML Parser
 *
 * Extracts structured text from Wikipedia article HTML, preserving the
 * structure of infoboxes and spec tables that the regex-based stripHtml()
 * in documentParser.ts would lose.
 *
 * Uses jsdom (already a devDependency) via dynamic import to avoid
 * Next.js build issues — same pattern as pdf-parse in documentParser.ts.
 */

import type { ParsedSection } from './scraper.types'

/** Sections to skip when extracting article content. */
const SKIP_SECTIONS = new Set([
  'references',
  'external links',
  'see also',
  'further reading',
  'notes',
  'footnotes',
  'bibliography',
  'sources',
])

/** Result of parsing a Wikipedia article. */
export interface WikiParseResult {
  fullText: string
  sections: ParsedSection[]
  infoboxText: string | null
}

/**
 * Parses Wikipedia article HTML into structured text optimized for
 * motorcycle spec extraction.
 *
 * Uses jsdom to traverse the DOM, extracting:
 * 1. Infobox key-value pairs (the spec sidebar)
 * 2. Data tables with preserved row structure
 * 3. Article sections with heading hierarchy
 */
export async function parseWikipediaHtml(
  html: string,
  title: string
): Promise<WikiParseResult> {
  const { JSDOM } = await import('jsdom')
  const dom = new JSDOM(html)
  const doc = dom.window.document

  const infoboxText = extractInfobox(doc)
  const tables = extractTables(doc)
  const sections = extractSections(doc)

  const fullText = assembleStructuredText(title, infoboxText, tables, sections)

  return { fullText, sections, infoboxText }
}

/**
 * Extracts the motorcycle infobox from Wikipedia HTML.
 * Returns structured "Key: Value" lines for each row.
 *
 * Wikipedia infoboxes use class="infobox" on the <table> element.
 * Each row typically has a <th> (label) and <td> (value).
 */
export function extractInfobox(doc: Document): string | null {
  const infobox = doc.querySelector('table.infobox')
  if (!infobox) return null

  const lines: string[] = []
  const rows = infobox.querySelectorAll('tr')

  for (const row of Array.from(rows)) {
    const th = row.querySelector('th')
    const td = row.querySelector('td')

    if (th && td) {
      const label = cleanText(th.textContent || '')
      const value = cleanText(td.textContent || '')
      if (label && value) {
        lines.push(`${label}: ${value}`)
      }
    } else if (th && !td) {
      // Header row (e.g., the motorcycle name)
      const headerText = cleanText(th.textContent || '')
      if (headerText) {
        lines.push(headerText)
      }
    }
  }

  return lines.length > 0 ? lines.join('\n') : null
}

/**
 * Extracts all data tables from the article (excluding the infobox).
 * Returns each table as structured "Header | Value" lines.
 */
export function extractTables(doc: Document): string[] {
  const tables = doc.querySelectorAll('table.wikitable')
  const results: string[] = []

  for (const table of Array.from(tables)) {
    const lines: string[] = []
    const rows = table.querySelectorAll('tr')

    for (const row of Array.from(rows)) {
      const cells = row.querySelectorAll('th, td')
      if (cells.length === 0) continue

      const cellTexts = Array.from(cells).map((cell) =>
        cleanText(cell.textContent || '')
      )

      // Skip rows that are all empty
      if (cellTexts.every((t) => !t)) continue

      lines.push(cellTexts.join(' | '))
    }

    if (lines.length > 1) {
      results.push(lines.join('\n'))
    }
  }

  return results
}

/**
 * Extracts article sections with headings.
 * Skips boilerplate sections (References, External links, etc.).
 */
export function extractSections(doc: Document): ParsedSection[] {
  const sections: ParsedSection[] = []
  const headings = doc.querySelectorAll('h2, h3, h4')

  for (const heading of Array.from(headings)) {
    const headingText = cleanText(heading.textContent || '')
    if (!headingText) continue

    // Skip boilerplate sections
    if (SKIP_SECTIONS.has(headingText.toLowerCase())) continue

    // Also skip the edit links that Wikipedia adds
    const cleanedHeading = headingText.replace(/\[edit\]/gi, '').trim()
    if (!cleanedHeading) continue

    const level = parseInt(heading.tagName.substring(1), 10)

    // Collect content until the next heading of same or higher level
    const contentParts: string[] = []
    let sibling = heading.nextElementSibling

    while (sibling) {
      const tagName = sibling.tagName.toLowerCase()

      // Stop at next heading of same or higher level
      if (/^h[2-4]$/.test(tagName)) {
        const siblingLevel = parseInt(tagName.substring(1), 10)
        if (siblingLevel <= level) break
      }

      // Skip tables (handled separately by extractTables)
      if (tagName === 'table') {
        sibling = sibling.nextElementSibling
        continue
      }

      const text = cleanText(sibling.textContent || '')
      if (text) {
        contentParts.push(text)
      }

      sibling = sibling.nextElementSibling
    }

    if (contentParts.length > 0) {
      sections.push({
        heading: cleanedHeading,
        content: contentParts.join('\n\n'),
        level,
      })
    }
  }

  return sections
}

/**
 * Combines infobox, tables, and sections into a single text document
 * with clear section markers that the chunker can recognize.
 *
 * Output format uses ALL CAPS headings so the chunker's
 * detectSectionTitle() picks them up as section boundaries.
 */
export function assembleStructuredText(
  title: string,
  infobox: string | null,
  tables: string[],
  sections: ParsedSection[]
): string {
  const parts: string[] = []

  // Title as main heading
  parts.push(title.toUpperCase())
  parts.push('')

  // Infobox specs
  if (infobox) {
    parts.push('SPECIFICATIONS')
    parts.push(infobox)
    parts.push('')
  }

  // Data tables
  if (tables.length > 0) {
    for (let i = 0; i < tables.length; i++) {
      parts.push(`TECHNICAL DATA TABLE ${i + 1}`)
      parts.push(tables[i])
      parts.push('')
    }
  }

  // Article sections
  for (const section of sections) {
    parts.push(section.heading.toUpperCase())
    parts.push(section.content)
    parts.push('')
  }

  return parts.join('\n').trim()
}

/**
 * Cleans extracted text: collapses whitespace, trims, removes
 * Wikipedia citation brackets like [1], [2], [citation needed].
 */
function cleanText(text: string): string {
  return text
    .replace(/\[(?:\d+|citation needed|edit)\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}
