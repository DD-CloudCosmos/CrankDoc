import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  parsePdf,
  parseManualEntry,
  parseWebContent,
  computeFileHash,
} from './documentParser'

// ---------------------------------------------------------------------------
// Mock pdf-parse v2 (class-based API)
// ---------------------------------------------------------------------------

const mockGetText = vi.fn()
const mockGetInfo = vi.fn()
const mockDestroy = vi.fn().mockResolvedValue(undefined)

vi.mock('pdf-parse', () => {
  // Must use a regular function (not arrow) to work as a constructor with `new`
  function MockPDFParse() {
    return {
      getText: mockGetText,
      getInfo: mockGetInfo,
      destroy: mockDestroy,
    }
  }
  return { PDFParse: MockPDFParse }
})

/**
 * Helper to configure mock responses for getText and getInfo.
 * Accepts a v1-style result shape and maps it to v2 mock responses.
 */
function configurePdfMock(result: {
  numpages: number
  text: string
  info?: { Title?: string; [key: string]: unknown }
}) {
  // Build v2-style page results from form-feed-separated text
  const pageTexts = result.text.includes('\f')
    ? result.text.split('\f')
    : result.text ? [result.text] : []

  mockGetText.mockResolvedValueOnce({
    pages: pageTexts.map((text, i) => ({ num: i + 1, text })),
    text: result.text,
    total: result.numpages,
  })
  mockGetInfo.mockResolvedValueOnce({
    info: result.info || {},
    total: result.numpages,
  })
}

/**
 * Configure mock to reject on getText (simulates corrupt PDF).
 */
function configurePdfMockError(error: Error) {
  mockGetText.mockRejectedValueOnce(error)
}

// ---------------------------------------------------------------------------
// parsePdf
// ---------------------------------------------------------------------------

describe('parsePdf', () => {
  beforeEach(() => {
    mockGetText.mockReset()
    mockGetInfo.mockReset()
    mockDestroy.mockReset().mockResolvedValue(undefined)
  })

  it('extracts text and metadata from a valid PDF buffer', async () => {
    const pageOneText = 'This is page one with enough content to exceed the scanned page threshold for proper detection in the parser module.'
    const pageTwoText = 'This is page two with sufficient text content to also be recognized as a real text-based page by the document parser.'
    configurePdfMock({
      numpages: 2,
      text: `${pageOneText}\f${pageTwoText}`,
      info: { Title: 'Service Manual' },
    })

    const result = await parsePdf(Buffer.from('fake-pdf-data'))

    expect(result.totalPages).toBe(2)
    expect(result.title).toBe('Service Manual')
    expect(result.pages).toHaveLength(2)
    expect(result.pages[0].pageNumber).toBe(1)
    expect(result.pages[0].text).toBe(pageOneText)
    expect(result.pages[0].isScanned).toBe(false)
    expect(result.pages[1].pageNumber).toBe(2)
    expect(result.pages[1].text).toBe(pageTwoText)
    expect(result.metadata.sourceType).toBe('pdf')
    expect(result.metadata.fileHash).toBeTruthy()
  })

  it('detects scanned pages when text is very short', async () => {
    // Each page has fewer than 100 characters — should be flagged as scanned
    configurePdfMock({
      numpages: 2,
      text: 'Hi\fOk',
      info: { Title: 'Scanned Doc' },
    })

    const result = await parsePdf(Buffer.from('scanned-pdf'))

    expect(result.pages[0].isScanned).toBe(true)
    expect(result.pages[1].isScanned).toBe(true)
    // Average chars per page < 100 means whole doc is considered a scan
    expect(result.metadata.sourceType).toBe('scan')
  })

  it('sets sourceType to pdf when average chars per page exceeds threshold', async () => {
    const longPageText = 'A'.repeat(200)
    configurePdfMock({
      numpages: 1,
      text: longPageText,
      info: {},
    })

    const result = await parsePdf(Buffer.from('text-rich-pdf'))

    expect(result.metadata.sourceType).toBe('pdf')
    expect(result.pages[0].isScanned).toBe(false)
  })

  it('returns an empty document when pdf-parse throws', async () => {
    configurePdfMockError(new Error('Corrupt PDF'))

    const result = await parsePdf(Buffer.from('corrupt-data'))

    expect(result.pages).toEqual([])
    expect(result.totalPages).toBe(0)
    expect(result.title).toBe('Untitled PDF')
    expect(result.metadata.sourceType).toBe('pdf')
    expect(result.metadata.fileHash).toBeTruthy()
  })

  it('uses "Untitled PDF" when no title is in PDF info', async () => {
    configurePdfMock({
      numpages: 1,
      text: 'Some content here that is longer than the threshold for scanning detection purposes.',
      info: {},
    })

    const result = await parsePdf(Buffer.from('no-title-pdf'))

    expect(result.title).toBe('Untitled PDF')
  })

  it('handles empty text from pdf-parse gracefully', async () => {
    configurePdfMock({
      numpages: 3,
      text: '',
      info: { Title: 'Empty PDF' },
    })

    const result = await parsePdf(Buffer.from('empty-text-pdf'))

    expect(result.totalPages).toBe(3)
    expect(result.pages).toHaveLength(1)
    expect(result.pages[0].text).toBe('')
    expect(result.pages[0].isScanned).toBe(true)
    expect(result.metadata.sourceType).toBe('scan')
  })
})

// ---------------------------------------------------------------------------
// parseManualEntry
// ---------------------------------------------------------------------------

describe('parseManualEntry', () => {
  it('wraps plain text into a single-page ParsedDocument', async () => {
    const result = await parseManualEntry(
      'Honda CBR600RR valve clearance: intake 0.16mm, exhaust 0.25mm',
      'Valve Specs'
    )

    expect(result.totalPages).toBe(1)
    expect(result.title).toBe('Valve Specs')
    expect(result.pages).toHaveLength(1)
    expect(result.pages[0].pageNumber).toBe(1)
    expect(result.pages[0].text).toBe(
      'Honda CBR600RR valve clearance: intake 0.16mm, exhaust 0.25mm'
    )
    expect(result.pages[0].isScanned).toBe(false)
    expect(result.metadata.sourceType).toBe('manual_entry')
    expect(result.metadata.fileHash).toBeNull()
  })

  it('returns an empty document for blank text', async () => {
    const result = await parseManualEntry('', 'Empty Entry')

    expect(result.totalPages).toBe(0)
    expect(result.pages).toEqual([])
    expect(result.title).toBe('Empty Entry')
    expect(result.metadata.sourceType).toBe('manual_entry')
  })

  it('trims whitespace-only text and returns empty document', async () => {
    const result = await parseManualEntry('   \n\t  ', 'Whitespace Only')

    expect(result.totalPages).toBe(0)
    expect(result.pages).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// parseWebContent
// ---------------------------------------------------------------------------

describe('parseWebContent', () => {
  it('strips HTML tags and extracts text content', async () => {
    const html = '<h1>Torque Specs</h1><p>Cylinder head bolts: 39 Nm</p>'
    const result = await parseWebContent(html, 'Torque Page')

    expect(result.totalPages).toBe(1)
    expect(result.title).toBe('Torque Page')
    expect(result.pages[0].text).toContain('Torque Specs')
    expect(result.pages[0].text).toContain('Cylinder head bolts: 39 Nm')
    expect(result.pages[0].text).not.toContain('<h1>')
    expect(result.pages[0].text).not.toContain('<p>')
    expect(result.metadata.sourceType).toBe('web')
    expect(result.metadata.fileHash).toBeNull()
  })

  it('removes script and style blocks completely', async () => {
    const html = `
      <html>
        <head><style>body { color: red; }</style></head>
        <body>
          <script>alert("xss")</script>
          <p>Useful content</p>
          <script type="text/javascript">console.log("more js")</script>
        </body>
      </html>
    `
    const result = await parseWebContent(html, 'Cleaned Page')

    expect(result.pages[0].text).toContain('Useful content')
    expect(result.pages[0].text).not.toContain('alert')
    expect(result.pages[0].text).not.toContain('console.log')
    expect(result.pages[0].text).not.toContain('color: red')
  })

  it('decodes common HTML entities', async () => {
    const html = '<p>Oil &amp; filter &mdash; 5W-30 &lt;synthetic&gt;</p>'
    const result = await parseWebContent(html, 'Entities Page')

    expect(result.pages[0].text).toContain('Oil & filter')
    expect(result.pages[0].text).toContain('<synthetic>')
  })

  it('returns empty document for HTML with no text content', async () => {
    const html = '<script>var x = 1;</script><style>.a{}</style>'
    const result = await parseWebContent(html, 'Empty Web Page')

    expect(result.totalPages).toBe(0)
    expect(result.pages).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// computeFileHash
// ---------------------------------------------------------------------------

describe('computeFileHash', () => {
  it('returns a 64-character hex string (SHA-256)', async () => {
    const hash = await computeFileHash(Buffer.from('test data'))

    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('returns the same hash for identical buffers', async () => {
    const data = Buffer.from('identical content')
    const hash1 = await computeFileHash(data)
    const hash2 = await computeFileHash(data)

    expect(hash1).toBe(hash2)
  })

  it('returns different hashes for different buffers', async () => {
    const hash1 = await computeFileHash(Buffer.from('content A'))
    const hash2 = await computeFileHash(Buffer.from('content B'))

    expect(hash1).not.toBe(hash2)
  })
})
