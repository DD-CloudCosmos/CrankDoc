import { describe, it, expect, vi } from 'vitest'
import {
  parseManualFilename,
  normalizeForMatch,
  buildCoverageMatrix,
} from './manuals'
import { scanLocalManuals } from './manuals.server'
import type { Motorcycle, DocumentSource } from '@/types/database.types'

describe('parseManualFilename', () => {
  it('parses a standard service manual filename', () => {
    const result = parseManualFilename('kymco-ak550-service.pdf')
    expect(result).toEqual({
      make: 'kymco',
      model: 'ak550',
      manualType: 'service_manual',
      year: null,
    })
  })

  it('parses a workshop manual filename as service_manual', () => {
    const result = parseManualFilename('kymco-agility125-workshop.pdf')
    expect(result).toEqual({
      make: 'kymco',
      model: 'agility125',
      manualType: 'service_manual',
      year: null,
    })
  })

  it('parses an owners manual with year', () => {
    const result = parseManualFilename('honda-cbr600rr-owners-2007.pdf')
    expect(result).toEqual({
      make: 'honda',
      model: 'cbr600rr',
      manualType: 'owners_manual',
      year: 2007,
    })
  })

  it('parses a riders manual as owners_manual', () => {
    const result = parseManualFilename('bmw-r1250gs-riders-2019.pdf')
    expect(result).toEqual({
      make: 'bmw',
      model: 'r1250gs',
      manualType: 'owners_manual',
      year: 2019,
    })
  })

  it('parses a multi-segment model name before the type keyword', () => {
    const result = parseManualFilename('bmw-r1250gs-adventure-riders-2021-us.pdf')
    expect(result).toEqual({
      make: 'bmw',
      model: 'r1250gsadventure',
      manualType: 'owners_manual',
      year: 2021,
    })
  })

  it('parses kymco like125i service manual', () => {
    const result = parseManualFilename('kymco-like125i-service.pdf')
    expect(result).toEqual({
      make: 'kymco',
      model: 'like125i',
      manualType: 'service_manual',
      year: null,
    })
  })

  it('parses a harley service manual with year range', () => {
    const result = parseManualFilename('harley-sportster-service-1986-2003.pdf')
    expect(result).toEqual({
      make: 'harley',
      model: 'sportster',
      manualType: 'service_manual',
      year: 1986,
    })
  })

  it('returns null for non-PDF files', () => {
    expect(parseManualFilename('readme.txt')).toBeNull()
    expect(parseManualFilename('manual.doc')).toBeNull()
  })

  it('returns null for filenames with too few parts', () => {
    expect(parseManualFilename('honda-owners.pdf')).toBeNull()
  })

  it('returns null for filenames with no type keyword', () => {
    expect(parseManualFilename('honda-cbr600rr-2024.pdf')).toBeNull()
  })

  it('returns null for empty filename', () => {
    expect(parseManualFilename('')).toBeNull()
  })
})

describe('normalizeForMatch', () => {
  it('lowercases and strips spaces', () => {
    expect(normalizeForMatch('CBR 600RR')).toBe('cbr600rr')
  })

  it('strips hyphens', () => {
    expect(normalizeForMatch('MT-07')).toBe('mt07')
  })

  it('strips dots and underscores', () => {
    expect(normalizeForMatch('R_1250.GS')).toBe('r1250gs')
  })

  it('handles already normalized strings', () => {
    expect(normalizeForMatch('cbr600rr')).toBe('cbr600rr')
  })
})

describe('buildCoverageMatrix', () => {
  const makeMotorcycle = (overrides: Partial<Motorcycle> = {}): Motorcycle => ({
    id: '1',
    make: 'Honda',
    model: 'CBR600RR',
    year_start: 2003,
    year_end: 2024,
    engine_type: null,
    displacement_cc: null,
    category: 'sport',
    image_url: null,
    generation: null,
    fuel_system: null,
    dry_weight_kg: null,
    horsepower: null,
    torque_nm: null,
    fuel_capacity_liters: null,
    oil_capacity_liters: null,
    coolant_capacity_liters: null,
    valve_clearance_intake: null,
    valve_clearance_exhaust: null,
    spark_plug: null,
    tire_front: null,
    tire_rear: null,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  })

  const makeDocSource = (overrides: Partial<DocumentSource> = {}): DocumentSource => ({
    id: 'ds-1',
    title: 'Honda CBR600RR Service Manual',
    source_type: 'pdf',
    file_path: null,
    file_hash: null,
    motorcycle_id: '1',
    make: 'Honda',
    model: 'CBR600RR',
    year_start: null,
    year_end: null,
    manual_type: 'service_manual',
    total_pages: null,
    processing_status: 'completed',
    processing_error: null,
    processed_at: null,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  })

  it('groups generations of the same model into one row', () => {
    const motorcycles = [
      makeMotorcycle({ id: '1', year_start: 2003, year_end: 2006 }),
      makeMotorcycle({ id: '2', year_start: 2007, year_end: 2012 }),
      makeMotorcycle({ id: '3', year_start: 2013, year_end: 2024 }),
    ]

    const { rows } = buildCoverageMatrix(motorcycles, [], [])

    expect(rows).toHaveLength(1)
    expect(rows[0].motorcycleIds).toEqual(['1', '2', '3'])
    expect(rows[0].yearRange).toBe('2003-2024')
  })

  it('sets status to ingested when document_source exists', () => {
    const motorcycles = [makeMotorcycle()]
    const docs = [makeDocSource({ motorcycle_id: '1', manual_type: 'service_manual' })]

    const { rows } = buildCoverageMatrix(motorcycles, docs, [])

    expect(rows[0].coverage.service_manual.status).toBe('ingested')
    expect(rows[0].coverage.service_manual.documentSources).toHaveLength(1)
  })

  it('sets status to local_only when only local file exists', () => {
    const motorcycles = [makeMotorcycle()]
    const localFiles = [
      {
        filename: 'honda-cbr600rr-owners-2007.pdf',
        parsed: { make: 'honda', model: 'cbr600rr', manualType: 'owners_manual' as const, year: 2007 },
      },
    ]

    const { rows } = buildCoverageMatrix(motorcycles, [], localFiles)

    expect(rows[0].coverage.owners_manual.status).toBe('local_only')
    expect(rows[0].coverage.owners_manual.localFiles).toEqual(['honda-cbr600rr-owners-2007.pdf'])
  })

  it('sets status to missing when no docs or files exist', () => {
    const motorcycles = [makeMotorcycle()]
    const { rows } = buildCoverageMatrix(motorcycles, [], [])

    expect(rows[0].coverage.service_manual.status).toBe('missing')
    expect(rows[0].coverage.owners_manual.status).toBe('missing')
    expect(rows[0].coverage.parts_catalog.status).toBe('missing')
    expect(rows[0].coverage.tsb.status).toBe('missing')
  })

  it('prefers ingested over local_only when both exist', () => {
    const motorcycles = [makeMotorcycle()]
    const docs = [makeDocSource({ motorcycle_id: '1', manual_type: 'service_manual' })]
    const localFiles = [
      {
        filename: 'honda-cbr600rr-service.pdf',
        parsed: { make: 'honda', model: 'cbr600rr', manualType: 'service_manual' as const, year: null },
      },
    ]

    const { rows } = buildCoverageMatrix(motorcycles, docs, localFiles)

    expect(rows[0].coverage.service_manual.status).toBe('ingested')
    expect(rows[0].coverage.service_manual.localFiles).toHaveLength(1)
    expect(rows[0].coverage.service_manual.documentSources).toHaveLength(1)
  })

  it('matches document_sources by make+model text when no motorcycle_id', () => {
    const motorcycles = [makeMotorcycle()]
    const docs = [
      makeDocSource({
        motorcycle_id: null,
        make: 'Honda',
        model: 'CBR600RR',
        manual_type: 'owners_manual',
      }),
    ]

    const { rows } = buildCoverageMatrix(motorcycles, docs, [])

    expect(rows[0].coverage.owners_manual.status).toBe('ingested')
  })

  it('computes summary statistics correctly', () => {
    const motorcycles = [
      makeMotorcycle({ id: '1', make: 'Honda', model: 'CBR600RR' }),
      makeMotorcycle({ id: '2', make: 'BMW', model: 'R1250GS', category: 'adventure' }),
    ]
    const docs = [makeDocSource({ motorcycle_id: '1', manual_type: 'service_manual' })]

    const { summary } = buildCoverageMatrix(motorcycles, docs, [])

    expect(summary.totalModels).toBe(2)
    expect(summary.modelsWithManuals).toBe(1)
    expect(summary.totalDocumentSources).toBe(1)
    expect(summary.localPdfCount).toBe(0)
    // 1 filled cell out of 8 total (2 models × 4 types) = 12.5% → rounded to 13%
    expect(summary.overallCoveragePercent).toBe(13)
  })

  it('sorts rows by make then model', () => {
    const motorcycles = [
      makeMotorcycle({ id: '2', make: 'Yamaha', model: 'MT-07' }),
      makeMotorcycle({ id: '1', make: 'Honda', model: 'CBR600RR' }),
      makeMotorcycle({ id: '3', make: 'BMW', model: 'R1250GS' }),
    ]

    const { rows } = buildCoverageMatrix(motorcycles, [], [])

    expect(rows.map((r) => r.make)).toEqual(['BMW', 'Honda', 'Yamaha'])
  })

  it('handles empty inputs', () => {
    const { rows, summary } = buildCoverageMatrix([], [], [])

    expect(rows).toEqual([])
    expect(summary.totalModels).toBe(0)
    expect(summary.overallCoveragePercent).toBe(0)
  })

  it('computes yearRange with + suffix when year_end is null', () => {
    const motorcycles = [makeMotorcycle({ year_start: 2019, year_end: null })]
    const { rows } = buildCoverageMatrix(motorcycles, [], [])

    expect(rows[0].yearRange).toBe('2019+')
  })

  it('counts totalDocs per row', () => {
    const motorcycles = [makeMotorcycle()]
    const docs = [
      makeDocSource({ id: 'ds-1', motorcycle_id: '1', manual_type: 'service_manual' }),
      makeDocSource({ id: 'ds-2', motorcycle_id: '1', manual_type: 'owners_manual' }),
    ]
    const localFiles = [
      {
        filename: 'honda-cbr600rr-parts.pdf',
        parsed: { make: 'honda', model: 'cbr600rr', manualType: 'parts_catalog' as const, year: null },
      },
    ]

    const { rows } = buildCoverageMatrix(motorcycles, docs, localFiles)

    expect(rows[0].totalDocs).toBe(3)
  })
})

describe('scanLocalManuals', () => {
  it('returns parsed manual files from directory listing', async () => {
    const mockReader = vi.fn().mockResolvedValue([
      'honda-cbr600rr-owners-2007.pdf',
      'kymco-ak550-service.pdf',
      'readme.txt',
    ])

    const results = await scanLocalManuals(mockReader)

    expect(results).toHaveLength(2)
    expect(results[0].filename).toBe('honda-cbr600rr-owners-2007.pdf')
    expect(results[0].parsed.manualType).toBe('owners_manual')
    expect(results[1].filename).toBe('kymco-ak550-service.pdf')
    expect(results[1].parsed.manualType).toBe('service_manual')
  })

  it('returns empty array when directory does not exist', async () => {
    const mockReader = vi.fn().mockRejectedValue(new Error('ENOENT'))

    const results = await scanLocalManuals(mockReader)

    expect(results).toEqual([])
  })

  it('filters out non-parseable files', async () => {
    const mockReader = vi.fn().mockResolvedValue([
      'notes.txt',
      'photo.jpg',
      'kymco-like125i-service.pdf',
    ])

    const results = await scanLocalManuals(mockReader)

    expect(results).toHaveLength(1)
    expect(results[0].filename).toBe('kymco-like125i-service.pdf')
  })
})
