import { describe, it, expect } from 'vitest'
import {
  detectContentType,
  detectSectionTitle,
  chunkDocument,
  buildMetadataPrefix,
} from './chunker'
import type { DocumentMetadata } from './chunker'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

type ParsedPage = {
  pageNumber: number
  text: string
  isScanned: boolean
}

/** Builds a default DocumentMetadata for testing */
function buildMetadata(overrides: Partial<DocumentMetadata> = {}): DocumentMetadata {
  return {
    make: 'Honda',
    model: 'CBR600RR',
    yearStart: 2007,
    yearEnd: 2012,
    manualType: 'Service Manual',
    ...overrides,
  }
}

/** Builds a ParsedPage for testing */
function buildPage(pageNumber: number, text: string, isScanned = false): ParsedPage {
  return { pageNumber, text, isScanned }
}

/**
 * Generates a long prose string of approximately the given character length.
 * Uses double newlines to create paragraph breaks every ~200 chars.
 */
function generateProse(charCount: number): string {
  const sentence = 'The engine requires regular maintenance to ensure optimal performance. '
  const paragraphLen = 200
  const paragraphs: string[] = []
  let total = 0

  while (total < charCount) {
    let paragraph = ''
    while (paragraph.length < paragraphLen && total + paragraph.length < charCount) {
      paragraph += sentence
    }
    paragraphs.push(paragraph.trim())
    total += paragraph.length + 2 // account for \n\n
  }

  return paragraphs.join('\n\n')
}

// ---------------------------------------------------------------------------
// detectContentType
// ---------------------------------------------------------------------------

describe('detectContentType', () => {
  it('detects spec table from displacement and bore/stroke values', () => {
    const text = 'Displacement: 599cc\nBore x Stroke: 67.0 x 42.5mm'
    expect(detectContentType(text)).toBe('spec_table')
  })

  it('detects torque table from torque keyword with Nm values', () => {
    const text = 'Cylinder head bolt: 39 Nm (29 lb-ft)\nTorque specifications for engine assembly'
    expect(detectContentType(text)).toBe('torque_table')
  })

  it('detects procedure from numbered steps', () => {
    const text = 'Step 1: Remove the spark plug\nStep 2: Inspect the electrode\nStep 3: Check the gap'
    expect(detectContentType(text)).toBe('procedure')
  })

  it('detects procedure from WARNING marker', () => {
    const text = 'WARNING: Disconnect the battery before proceeding.\nRemove the fuel tank cover.'
    expect(detectContentType(text)).toBe('procedure')
  })

  it('detects diagram caption from Figure reference', () => {
    const text = 'Figure 3-12: Valve train assembly'
    expect(detectContentType(text)).toBe('diagram_caption')
  })

  it('detects diagram caption from Fig abbreviation', () => {
    const text = 'Fig 4.1 - Exploded view of clutch assembly'
    expect(detectContentType(text)).toBe('diagram_caption')
  })

  it('detects wiring info from wire color codes and connector keyword', () => {
    const text = 'Connector C1: R/W wire to ECU terminal 4\nBL/Y wire to ground'
    expect(detectContentType(text)).toBe('wiring_info')
  })

  it('returns prose for generic text without special patterns', () => {
    const text = 'The motorcycle features a liquid-cooled inline-four engine with a high-revving character that makes it ideal for sport riding.'
    expect(detectContentType(text)).toBe('prose')
  })

  it('prioritizes torque_table over spec_table when torque keyword present', () => {
    const text = 'Torque specifications:\nCylinder head: 39 Nm\nCam cap: 12 Nm\nSpark plug: 18 Nm'
    expect(detectContentType(text)).toBe('torque_table')
  })

  it('detects spec_table with mixed units', () => {
    const text = 'Oil capacity: 3.1 L\nCoolant capacity: 2.8 L\nTire pressure front: 36 psi'
    expect(detectContentType(text)).toBe('spec_table')
  })
})

// ---------------------------------------------------------------------------
// detectSectionTitle
// ---------------------------------------------------------------------------

describe('detectSectionTitle', () => {
  it('detects ALL CAPS heading', () => {
    const text = 'VALVE CLEARANCE\nThe intake valve clearance should be checked every 16,000 miles.'
    expect(detectSectionTitle(text)).toBe('VALVE CLEARANCE')
  })

  it('detects chapter heading', () => {
    const text = 'Chapter 3: Engine\nThis chapter covers all engine-related maintenance procedures.'
    expect(detectSectionTitle(text)).toBe('Chapter 3: Engine')
  })

  it('detects numbered section heading', () => {
    const text = '3.2 Valve Train\nThe valve train consists of camshafts, rocker arms, and valves.'
    expect(detectSectionTitle(text)).toBe('3.2 Valve Train')
  })

  it('returns null for normal paragraph text', () => {
    const text = 'Check the oil level with the motorcycle on a level surface and the engine warmed up to operating temperature.'
    expect(detectSectionTitle(text)).toBeNull()
  })

  it('detects ALL CAPS heading with slashes and hyphens', () => {
    const text = 'FUEL/AIR DELIVERY SYSTEM\nThe fuel injection system uses four injectors.'
    expect(detectSectionTitle(text)).toBe('FUEL/AIR DELIVERY SYSTEM')
  })

  it('ignores very long ALL CAPS lines (> 60 chars)', () => {
    const longCaps = 'THIS IS A VERY LONG LINE THAT EXCEEDS SIXTY CHARACTERS AND SHOULD NOT BE DETECTED AS A HEADING AT ALL'
    expect(detectSectionTitle(longCaps)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// chunkDocument
// ---------------------------------------------------------------------------

describe('chunkDocument', () => {
  const metadata = buildMetadata()

  it('produces chunks from a multi-page document', () => {
    const pages = [
      buildPage(1, 'VALVE CLEARANCE\nIntake valve clearance: 0.16-0.19mm\nExhaust valve clearance: 0.22-0.27mm'),
      buildPage(2, 'Step 1: Remove the valve cover\nStep 2: Rotate crankshaft to TDC\nStep 3: Measure clearance with feeler gauge'),
      buildPage(3, 'Oil capacity: 3.1 L\nCoolant capacity: 2.8 L'),
    ]

    const chunks = chunkDocument(pages, metadata)

    expect(chunks.length).toBeGreaterThan(0)
    expect(chunks[0].chunkIndex).toBe(0)
    // Every chunk should have content
    for (const chunk of chunks) {
      expect(chunk.content.length).toBeGreaterThan(0)
    }
  })

  it('respects maximum chunk size (no chunk > 4800 chars)', () => {
    // Create pages with a lot of prose that will need splitting
    const longText = generateProse(8000)
    const pages = [
      buildPage(1, longText.slice(0, 4000)),
      buildPage(2, longText.slice(4000)),
    ]

    const chunks = chunkDocument(pages, metadata)

    for (const chunk of chunks) {
      expect(chunk.contentLength).toBeLessThanOrEqual(4800)
    }
  })

  it('respects minimum chunk size (no chunk < 400 chars, except last)', () => {
    // Create pages with enough content to produce multiple chunks
    const pages = [
      buildPage(1, generateProse(5000)),
      buildPage(2, generateProse(5000)),
    ]

    const chunks = chunkDocument(pages, metadata)

    // All chunks except possibly the last must meet minimum size
    for (let i = 0; i < chunks.length - 1; i++) {
      expect(chunks[i].contentLength).toBeGreaterThanOrEqual(400)
    }
  })

  it('keeps spec tables as atomic units (never split mid-table)', () => {
    const specTableText = [
      'Engine displacement: 599cc',
      'Bore x Stroke: 67.0 x 42.5mm',
      'Compression ratio: 12.2:1',
      'Maximum power: 88.0kW at 13500 rpm',
      'Idle speed: 1300 rpm',
      'Fuel system: PGM-DSFI',
      'Oil capacity: 3.4 L',
      'Coolant capacity: 2.01 L',
    ].join('\n')

    const pages = [buildPage(1, specTableText)]
    const chunks = chunkDocument(pages, metadata)

    // The table is well under 4800 chars, so it should be a single chunk
    expect(chunks.length).toBe(1)
    expect(chunks[0].contentType).toBe('spec_table')
    // Verify the entire table is in one chunk
    expect(chunks[0].content).toContain('599cc')
    expect(chunks[0].content).toContain('2.01 L')
  })

  it('correctly tracks page numbers across chunks', () => {
    const pages = [
      buildPage(5, generateProse(3000)),
      buildPage(6, generateProse(3000)),
      buildPage(7, generateProse(3000)),
    ]

    const chunks = chunkDocument(pages, metadata)

    // All page numbers in chunks should be from our input pages
    for (const chunk of chunks) {
      for (const pn of chunk.pageNumbers) {
        expect([5, 6, 7]).toContain(pn)
      }
    }
  })

  it('handles empty pages gracefully', () => {
    const pages = [
      buildPage(1, ''),
      buildPage(2, '   '),
      buildPage(3, 'Some actual content about the motorcycle engine.'),
    ]

    const chunks = chunkDocument(pages, metadata)

    // Should still produce chunks from the non-empty page
    expect(chunks.length).toBeGreaterThan(0)
    expect(chunks[0].content).toContain('motorcycle engine')
  })

  it('handles single-page document', () => {
    const pages = [
      buildPage(1, 'Oil capacity: 3.1 L\nCoolant capacity: 2.8 L'),
    ]

    const chunks = chunkDocument(pages, metadata)

    expect(chunks.length).toBe(1)
    expect(chunks[0].pageNumbers).toEqual([1])
  })

  it('assigns correct content types to chunks', () => {
    // Procedure text must be > 400 chars to avoid being merged into the spec chunk
    const procedureSteps = [
      'MAINTENANCE PROCEDURE',
      'Step 1: Remove the spark plug using a 16mm spark plug socket. Disconnect the ignition coil connector before removal.',
      'Step 2: Inspect the electrode for signs of fouling, carbon deposits, or oil contamination. Replace if the electrode is worn beyond specification.',
      'Step 3: Check the gap using a feeler gauge. The standard gap is 0.6-0.7mm. Adjust as needed by carefully bending the ground electrode.',
      'Step 4: Apply anti-seize compound to the threads and reinstall the spark plug. Torque to specification.',
    ].join('\n')

    const pages = [
      buildPage(1, 'SPECIFICATIONS\nDisplacement: 599cc\nBore: 67.0mm\nStroke: 42.5mm'),
      buildPage(2, procedureSteps),
    ]

    const chunks = chunkDocument(pages, metadata)

    // Find a chunk with spec data
    const specChunk = chunks.find((c) => c.content.includes('599cc'))
    expect(specChunk).toBeDefined()
    expect(specChunk!.contentType).toBe('spec_table')

    // Find a chunk with procedure data
    const procChunk = chunks.find((c) => c.content.includes('Step 1'))
    expect(procChunk).toBeDefined()
    expect(procChunk!.contentType).toBe('procedure')
  })

  it('returns empty array for all-empty pages', () => {
    const pages = [
      buildPage(1, ''),
      buildPage(2, ''),
    ]

    const chunks = chunkDocument(pages, metadata)

    expect(chunks).toEqual([])
  })

  it('assigns sequential chunkIndex values', () => {
    const pages = [
      buildPage(1, generateProse(5000)),
      buildPage(2, generateProse(5000)),
    ]

    const chunks = chunkDocument(pages, metadata)

    for (let i = 0; i < chunks.length; i++) {
      expect(chunks[i].chunkIndex).toBe(i)
    }
  })

  it('detects and preserves section titles from page content', () => {
    const pages = [
      buildPage(1, 'COOLING SYSTEM\nThe cooling system uses a liquid-cooled radiator configuration.'),
    ]

    const chunks = chunkDocument(pages, metadata)

    expect(chunks.length).toBeGreaterThan(0)
    expect(chunks[0].sectionTitle).toBe('COOLING SYSTEM')
    expect(chunks[0].sectionHierarchy).toContain('COOLING SYSTEM')
  })

  it('carries section context forward to subsequent pages', () => {
    const pages = [
      buildPage(1, 'ENGINE SPECIFICATIONS\nBasic engine overview and design philosophy.'),
      buildPage(2, 'The engine uses a counterbalancer to reduce vibration.'),
    ]

    const chunks = chunkDocument(pages, metadata)

    // All chunks should inherit the section title from page 1
    for (const chunk of chunks) {
      expect(chunk.sectionTitle).toBe('ENGINE SPECIFICATIONS')
    }
  })
})

// ---------------------------------------------------------------------------
// buildMetadataPrefix
// ---------------------------------------------------------------------------

describe('buildMetadataPrefix', () => {
  it('includes make, model, year range, manual type, and section title', () => {
    const metadata = buildMetadata()
    const result = buildMetadataPrefix(metadata, 'Valve Clearance')

    expect(result).toBe('[Honda CBR600RR 2007-2012 | Service Manual | Valve Clearance]')
  })

  it('handles null yearEnd by showing only yearStart', () => {
    const metadata = buildMetadata({ yearEnd: null })
    const result = buildMetadataPrefix(metadata, 'Engine')

    expect(result).toBe('[Honda CBR600RR 2007 | Service Manual | Engine]')
  })

  it('handles null sectionTitle by omitting section', () => {
    const metadata = buildMetadata()
    const result = buildMetadataPrefix(metadata, null)

    expect(result).toBe('[Honda CBR600RR 2007-2012 | Service Manual]')
  })

  it('works with different makes and models', () => {
    const metadata = buildMetadata({
      make: 'Yamaha',
      model: 'YZF-R6',
      yearStart: 2017,
      yearEnd: 2020,
      manualType: 'Owners Manual',
    })
    const result = buildMetadataPrefix(metadata, 'Lubrication')

    expect(result).toBe('[Yamaha YZF-R6 2017-2020 | Owners Manual | Lubrication]')
  })
})
