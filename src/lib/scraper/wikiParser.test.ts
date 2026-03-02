import { describe, it, expect } from 'vitest'
import {
  parseWikipediaHtml,
  extractInfobox,
  extractTables,
  extractSections,
  assembleStructuredText,
} from './wikiParser'
import { JSDOM } from 'jsdom'

// ---------------------------------------------------------------------------
// HTML Fixtures
// ---------------------------------------------------------------------------

const INFOBOX_HTML = `
<table class="infobox">
  <tr><th colspan="2">Honda CBR600RR</th></tr>
  <tr><th>Manufacturer</th><td><a href="/wiki/Honda">Honda</a></td></tr>
  <tr><th>Production</th><td>2003–2024</td></tr>
  <tr><th>Engine</th><td>599 cc (36.6 cu in) liquid-cooled inline-4</td></tr>
  <tr><th>Power</th><td>118 hp (88 kW) at 13,500 rpm</td></tr>
  <tr><th>Torque</th><td>66 Nm (48.7 lb·ft) at 11,250 rpm</td></tr>
  <tr><th>Weight</th><td>170 kg (375 lb) dry</td></tr>
</table>
`

const WIKITABLE_HTML = `
<table class="wikitable">
  <tr><th>Generation</th><th>Years</th><th>Power</th><th>Weight</th></tr>
  <tr><td>Gen 1</td><td>2003–2004</td><td>117 hp</td><td>170 kg</td></tr>
  <tr><td>Gen 2</td><td>2005–2006</td><td>118 hp</td><td>155 kg</td></tr>
  <tr><td>Gen 3</td><td>2007–2012</td><td>118 hp</td><td>156 kg</td></tr>
</table>
`

const SECTIONS_HTML = `
<h2>History</h2>
<p>The Honda CBR600RR was introduced in 2003.[1]</p>
<p>It replaced the CBR600F4i in Honda's lineup.</p>
<h3>First generation</h3>
<p>The first generation featured an inline-4 engine with 599 cc displacement.</p>
<h2>See also</h2>
<p>Honda CBR1000RR</p>
<h2>References</h2>
<p>[1] Honda press release</p>
`

const FULL_ARTICLE_HTML = `
<div>
  ${INFOBOX_HTML}
  <h2>Overview</h2>
  <p>The Honda CBR600RR is a 599 cc sport motorcycle.[1][2]</p>
  ${WIKITABLE_HTML}
  <h2>Engine</h2>
  <p>The engine produces 118 hp at 13,500 rpm and 66 Nm at 11,250 rpm.</p>
  <h2>See also</h2>
  <p>Other Honda models</p>
  <h2>References</h2>
  <p>[1] Source</p>
</div>
`

/** Helper to get a DOM Document from HTML. */
function toDocument(html: string): Document {
  return new JSDOM(html).window.document
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('extractInfobox', () => {
  it('extracts key-value pairs from a standard motorcycle infobox', () => {
    const doc = toDocument(INFOBOX_HTML)
    const result = extractInfobox(doc)

    expect(result).not.toBeNull()
    expect(result).toContain('Manufacturer: Honda')
    expect(result).toContain('Production: 2003–2024')
    expect(result).toContain('Engine: 599 cc (36.6 cu in) liquid-cooled inline-4')
    expect(result).toContain('Power: 118 hp (88 kW) at 13,500 rpm')
    expect(result).toContain('Torque: 66 Nm (48.7 lb·ft) at 11,250 rpm')
  })

  it('includes header rows (motorcycle name)', () => {
    const doc = toDocument(INFOBOX_HTML)
    const result = extractInfobox(doc)!

    expect(result).toContain('Honda CBR600RR')
  })

  it('strips HTML links but preserves link text', () => {
    const doc = toDocument(INFOBOX_HTML)
    const result = extractInfobox(doc)!

    // "Honda" should appear without <a> tags
    expect(result).toContain('Manufacturer: Honda')
    expect(result).not.toContain('<a')
  })

  it('returns null when no infobox is found', () => {
    const doc = toDocument('<div><p>No infobox here</p></div>')
    expect(extractInfobox(doc)).toBeNull()
  })

  it('handles infobox with missing fields gracefully', () => {
    const html = `
      <table class="infobox">
        <tr><th>Make</th><td>Honda</td></tr>
        <tr><th>Model</th><td></td></tr>
        <tr><th></th><td>Some value</td></tr>
      </table>
    `
    const doc = toDocument(html)
    const result = extractInfobox(doc)!

    expect(result).toContain('Make: Honda')
    // Empty label or value rows should be skipped
    expect(result).not.toContain('Model:')
  })
})

describe('extractTables', () => {
  it('extracts wikitable data with headers and rows', () => {
    const doc = toDocument(WIKITABLE_HTML)
    const result = extractTables(doc)

    expect(result).toHaveLength(1)
    expect(result[0]).toContain('Generation | Years | Power | Weight')
    expect(result[0]).toContain('Gen 1 | 2003–2004 | 117 hp | 170 kg')
    expect(result[0]).toContain('Gen 3 | 2007–2012 | 118 hp | 156 kg')
  })

  it('handles multiple tables', () => {
    const html = `
      ${WIKITABLE_HTML}
      <table class="wikitable">
        <tr><th>Component</th><th>Torque</th></tr>
        <tr><td>Axle nut</td><td>59 Nm</td></tr>
      </table>
    `
    const doc = toDocument(html)
    const result = extractTables(doc)

    expect(result).toHaveLength(2)
  })

  it('returns empty array when no wikitables exist', () => {
    const doc = toDocument('<div><p>No tables</p></div>')
    expect(extractTables(doc)).toEqual([])
  })

  it('skips tables with only one row (header-only)', () => {
    const html = `
      <table class="wikitable">
        <tr><th>Only header</th></tr>
      </table>
    `
    const doc = toDocument(html)
    expect(extractTables(doc)).toEqual([])
  })
})

describe('extractSections', () => {
  it('extracts article sections with heading and content', () => {
    const doc = toDocument(SECTIONS_HTML)
    const result = extractSections(doc)

    expect(result.length).toBeGreaterThanOrEqual(2)
    const history = result.find((s) => s.heading === 'History')
    expect(history).toBeDefined()
    expect(history!.content).toContain('introduced in 2003')
  })

  it('strips citation brackets from content', () => {
    const doc = toDocument(SECTIONS_HTML)
    const result = extractSections(doc)
    const history = result.find((s) => s.heading === 'History')!

    expect(history.content).not.toContain('[1]')
  })

  it('skips References, See also, and External links sections', () => {
    const doc = toDocument(SECTIONS_HTML)
    const result = extractSections(doc)
    const headings = result.map((s) => s.heading.toLowerCase())

    expect(headings).not.toContain('see also')
    expect(headings).not.toContain('references')
  })

  it('captures heading level', () => {
    const doc = toDocument(SECTIONS_HTML)
    const result = extractSections(doc)
    const history = result.find((s) => s.heading === 'History')!
    const firstGen = result.find((s) => s.heading === 'First generation')!

    expect(history.level).toBe(2)
    expect(firstGen.level).toBe(3)
  })

  it('returns empty array for content with no headings', () => {
    const doc = toDocument('<div><p>Just text</p></div>')
    expect(extractSections(doc)).toEqual([])
  })
})

describe('assembleStructuredText', () => {
  it('assembles title, infobox, tables, and sections', () => {
    const sections = [
      { heading: 'Overview', content: 'A sport motorcycle.', level: 2 },
    ]
    const result = assembleStructuredText(
      'Honda CBR600RR',
      'Manufacturer: Honda\nPower: 118 hp',
      ['Gen | Power\n1 | 117 hp'],
      sections
    )

    expect(result).toContain('HONDA CBR600RR')
    expect(result).toContain('SPECIFICATIONS')
    expect(result).toContain('Manufacturer: Honda')
    expect(result).toContain('TECHNICAL DATA TABLE 1')
    expect(result).toContain('Gen | Power')
    expect(result).toContain('OVERVIEW')
    expect(result).toContain('A sport motorcycle.')
  })

  it('omits specifications section when infobox is null', () => {
    const result = assembleStructuredText('Test', null, [], [])
    expect(result).not.toContain('SPECIFICATIONS')
  })

  it('omits table section when no tables exist', () => {
    const result = assembleStructuredText('Test', null, [], [])
    expect(result).not.toContain('TECHNICAL DATA TABLE')
  })

  it('uses ALL CAPS headings for chunker section detection', () => {
    const sections = [
      { heading: 'Engine', content: 'Inline four.', level: 2 },
    ]
    const result = assembleStructuredText('Test', null, [], sections)
    expect(result).toContain('ENGINE')
  })
})

describe('parseWikipediaHtml', () => {
  it('parses a full article and returns structured output', async () => {
    const result = await parseWikipediaHtml(FULL_ARTICLE_HTML, 'Honda CBR600RR')

    expect(result.infoboxText).toContain('Manufacturer: Honda')
    expect(result.sections.length).toBeGreaterThanOrEqual(1)
    expect(result.fullText).toContain('HONDA CBR600RR')
    expect(result.fullText).toContain('SPECIFICATIONS')
    expect(result.fullText).toContain('OVERVIEW')
  })

  it('does not include References or See also in sections', async () => {
    const result = await parseWikipediaHtml(FULL_ARTICLE_HTML, 'Honda CBR600RR')
    const headings = result.sections.map((s) => s.heading.toLowerCase())

    expect(headings).not.toContain('see also')
    expect(headings).not.toContain('references')
  })

  it('handles article with no infobox', async () => {
    const html = '<div><h2>Overview</h2><p>Some content</p></div>'
    const result = await parseWikipediaHtml(html, 'Test Bike')

    expect(result.infoboxText).toBeNull()
    expect(result.fullText).toContain('TEST BIKE')
    expect(result.fullText).not.toContain('SPECIFICATIONS')
  })
})
