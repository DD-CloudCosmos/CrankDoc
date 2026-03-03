/**
 * BMW Parser
 *
 * Parses spec pages from bmw-motorrad.com into structured text.
 */

import type { ParsedSection } from '../scraper.types'

export async function parseBmwHtml(
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

interface SpecRow { label: string; value: string }

function extractSpecs(doc: Document): SpecRow[] {
  const rows: SpecRow[] = []
  const tables = doc.querySelectorAll('table')
  for (const table of Array.from(tables)) {
    for (const tr of Array.from(table.querySelectorAll('tr'))) {
      const cells = tr.querySelectorAll('td, th')
      if (cells.length >= 2) {
        const label = cleanText(cells[0].textContent || '')
        const value = cleanText(cells[1].textContent || '')
        if (label && value && label.length < 50) rows.push({ label, value })
      }
    }
  }
  const dls = doc.querySelectorAll('dl')
  for (const dl of Array.from(dls)) {
    const dts = dl.querySelectorAll('dt')
    const dds = dl.querySelectorAll('dd')
    for (let i = 0; i < Math.min(dts.length, dds.length); i++) {
      const label = cleanText(dts[i].textContent || '')
      const value = cleanText(dds[i].textContent || '')
      if (label && value) rows.push({ label, value })
    }
  }
  return rows
}

function extractDescription(doc: Document): string | null {
  const parts: string[] = []
  for (const p of Array.from(doc.querySelectorAll('p'))) {
    const text = cleanText(p.textContent || '')
    if (text.length >= 40) parts.push(text)
  }
  return parts.length > 0 ? parts.join('\n\n') : null
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function cleanTitle(title: string): string {
  return title.replace(/\s*[-\u2013|]\s*BMW\s*Motorrad.*/i, '').replace(/\s*[-\u2013|]\s*BMW.*/i, '').trim()
}
