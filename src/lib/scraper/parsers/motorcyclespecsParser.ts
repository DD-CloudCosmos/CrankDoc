/**
 * MotorcycleSpecs Parser
 *
 * Parses HTML from motorcyclespecs.co.za spec pages into structured text.
 * The site uses basic HTML tables with two columns: spec labels and values.
 * Also contains narrative review text in paragraphs.
 *
 * Uses jsdom via dynamic import (same pattern as wikiParser.ts).
 */

import type { ParsedSection } from '../scraper.types'

/**
 * Parses motorcyclespecs.co.za HTML into structured text optimized for
 * the RAG chunker. Extracts spec table rows and narrative descriptions.
 */
export async function parseMotorcycleSpecsHtml(
  html: string,
  title: string
): Promise<{ fullText: string; sections: ParsedSection[] }> {
  const { JSDOM } = await import('jsdom')
  const dom = new JSDOM(html)
  const doc = dom.window.document

  const specs = extractSpecTable(doc)
  const description = extractDescription(doc)
  const sections: ParsedSection[] = []

  const parts: string[] = []

  // Title as main heading
  parts.push(cleanTitle(title).toUpperCase())
  parts.push('')

  // Spec table
  if (specs.length > 0) {
    const specContent = specs.map(({ label, value }) => `${label}: ${value}`).join('\n')
    parts.push('SPECIFICATIONS')
    parts.push(specContent)
    parts.push('')

    sections.push({
      heading: 'Specifications',
      content: specContent,
      level: 2,
    })
  }

  // Description / review text
  if (description) {
    parts.push('DESCRIPTION')
    parts.push(description)
    parts.push('')

    sections.push({
      heading: 'Description',
      content: description,
      level: 2,
    })
  }

  const fullText = parts.join('\n').trim()
  return { fullText, sections }
}

interface SpecRow {
  label: string
  value: string
}

/**
 * Extracts the spec table from the page. motorcyclespecs.co.za uses
 * basic HTML tables with two columns: label and value.
 */
function extractSpecTable(doc: Document): SpecRow[] {
  const rows: SpecRow[] = []
  const tables = doc.querySelectorAll('table')

  for (const table of Array.from(tables)) {
    const trs = table.querySelectorAll('tr')

    for (const tr of Array.from(trs)) {
      const cells = tr.querySelectorAll('td')
      if (cells.length >= 2) {
        const label = cleanText(cells[0].textContent || '')
        const value = cleanText(cells[1].textContent || '')

        if (label && value && !isAdContent(label) && !isAdContent(value)) {
          rows.push({ label, value })
        }
      }
    }
  }

  return rows
}

/**
 * Extracts narrative description text from paragraphs.
 * Filters out ad content and very short paragraphs.
 */
function extractDescription(doc: Document): string | null {
  const paragraphs = doc.querySelectorAll('p')
  const parts: string[] = []

  for (const p of Array.from(paragraphs)) {
    const text = cleanText(p.textContent || '')
    // Only include substantial paragraphs (skip short ad/nav text)
    if (text.length >= 50 && !isAdContent(text)) {
      parts.push(text)
    }
  }

  return parts.length > 0 ? parts.join('\n\n') : null
}

/** Cleans extracted text: collapses whitespace and trims. */
function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/** Cleans HTML page title (removes " - motorcyclespecs.co.za" etc.). */
function cleanTitle(title: string): string {
  return title
    .replace(/\s*[-–|]\s*motorcyclespecs\.co\.za.*/i, '')
    .replace(/\s*[-–|]\s*Pair\s*$/i, '')
    .trim()
}

/** Returns true if text looks like ad content. */
function isAdContent(text: string): boolean {
  const adPatterns = [
    /googletag/i,
    /adsbygoogle/i,
    /advertisement/i,
    /sponsored/i,
    /click here/i,
    /subscribe/i,
    /newsletter/i,
  ]
  return adPatterns.some((re) => re.test(text))
}
