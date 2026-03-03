/**
 * Yamaha Parser
 *
 * Parses spec pages from yamaha-motor.com into structured text.
 * Yamaha pages use structured HTML with spec sections in tables
 * or categorized spec blocks.
 */

import type { ParsedSection } from '../scraper.types'

export async function parseYamahaHtml(
  html: string,
  title: string
): Promise<{ fullText: string; sections: ParsedSection[] }> {
  const { JSDOM } = await import('jsdom')
  const dom = new JSDOM(html)
  const doc = dom.window.document

  const specs = extractSpecs(doc)
  const description = extractDescription(doc)
  const sections: ParsedSection[] = []
  const parts: string[] = []

  parts.push(cleanTitle(title).toUpperCase())
  parts.push('')

  if (specs.length > 0) {
    const specContent = specs.map(({ label, value }) => `${label}: ${value}`).join('\n')
    parts.push('SPECIFICATIONS')
    parts.push(specContent)
    parts.push('')
    sections.push({ heading: 'Specifications', content: specContent, level: 2 })
  }

  if (description) {
    parts.push('DESCRIPTION')
    parts.push(description)
    parts.push('')
    sections.push({ heading: 'Description', content: description, level: 2 })
  }

  return { fullText: parts.join('\n').trim(), sections }
}

interface SpecRow {
  label: string
  value: string
}

function extractSpecs(doc: Document): SpecRow[] {
  const rows: SpecRow[] = []

  // Yamaha uses tables and also div-based spec blocks
  const tables = doc.querySelectorAll('table')
  for (const table of Array.from(tables)) {
    for (const tr of Array.from(table.querySelectorAll('tr'))) {
      const cells = tr.querySelectorAll('td, th')
      if (cells.length >= 2) {
        const label = cleanText(cells[0].textContent || '')
        const value = cleanText(cells[1].textContent || '')
        if (label && value && label.length < 50) {
          rows.push({ label, value })
        }
      }
    }
  }

  // Yamaha also uses div pairs with spec-label/spec-value classes
  const specLabels = doc.querySelectorAll('.spec-label, .spec-name, [class*="spec"] dt')
  const specValues = doc.querySelectorAll('.spec-value, .spec-data, [class*="spec"] dd')
  for (let i = 0; i < Math.min(specLabels.length, specValues.length); i++) {
    const label = cleanText(specLabels[i].textContent || '')
    const value = cleanText(specValues[i].textContent || '')
    if (label && value) rows.push({ label, value })
  }

  return rows
}

function extractDescription(doc: Document): string | null {
  const paragraphs = doc.querySelectorAll('p')
  const parts: string[] = []
  for (const p of Array.from(paragraphs)) {
    const text = cleanText(p.textContent || '')
    if (text.length >= 40) parts.push(text)
  }
  return parts.length > 0 ? parts.join('\n\n') : null
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function cleanTitle(title: string): string {
  return title
    .replace(/\s*[-–|]\s*Yamaha\s*Motor.*/i, '')
    .replace(/\s*[-–|]\s*Yamaha.*/i, '')
    .trim()
}
