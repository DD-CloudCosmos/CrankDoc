/**
 * Manual Coverage — Types, Filename Parsing, and Coverage Matrix
 *
 * Pure data logic for the admin manual coverage dashboard.
 * No React or UI concerns — just types and functions.
 */

import type { Motorcycle, DocumentSource } from '@/types/database.types'

// --- Types ---

export type ManualType = 'service_manual' | 'owners_manual' | 'parts_catalog' | 'tsb'

export type CoverageStatus = 'ingested' | 'local_only' | 'missing'

export interface ManualCoverageCell {
  status: CoverageStatus
  localFiles: string[]
  documentSources: { id: string; title: string; processing_status: string }[]
}

export interface ModelCoverageRow {
  make: string
  model: string
  motorcycleIds: string[]
  yearRange: string
  category: string | null
  coverage: Record<ManualType, ManualCoverageCell>
  totalDocs: number
}

export interface CoverageSummary {
  modelsWithManuals: number
  totalModels: number
  totalDocumentSources: number
  localPdfCount: number | null
  overallCoveragePercent: number
}

export interface ParsedManualFilename {
  make: string
  model: string
  manualType: ManualType
  year: number | null
}

export const MANUAL_TYPES: ManualType[] = [
  'service_manual',
  'owners_manual',
  'parts_catalog',
  'tsb',
]

export const MANUAL_TYPE_LABELS: Record<ManualType, string> = {
  service_manual: 'Service',
  owners_manual: "Owner's",
  parts_catalog: 'Parts',
  tsb: 'TSB',
}

// --- Filename Parsing ---

/** Map of keywords found in filenames to their ManualType */
const FILENAME_TYPE_KEYWORDS: Record<string, ManualType> = {
  service: 'service_manual',
  workshop: 'service_manual',
  owners: 'owners_manual',
  owner: 'owners_manual',
  riders: 'owners_manual',
  rider: 'owners_manual',
  parts: 'parts_catalog',
  tsb: 'tsb',
  bulletin: 'tsb',
}

/**
 * Parse a manual PDF filename into structured data.
 *
 * Expected format: `make-model-type-year.pdf`
 * Examples:
 *   - `honda-cbr600rr-owners-2007.pdf`
 *   - `kymco-ak550-service.pdf`
 *   - `bmw-r1250gs-adventure-riders-2021-us.pdf`
 */
export function parseManualFilename(filename: string): ParsedManualFilename | null {
  if (!filename.endsWith('.pdf')) return null

  const basename = filename.replace('.pdf', '')
  const parts = basename.split('-')

  if (parts.length < 3) return null

  const make = parts[0]

  // Find the type keyword — scan from left to right after make
  let manualType: ManualType | null = null
  let typeIndex = -1

  for (let i = 1; i < parts.length; i++) {
    const keyword = parts[i].toLowerCase()
    if (FILENAME_TYPE_KEYWORDS[keyword]) {
      manualType = FILENAME_TYPE_KEYWORDS[keyword]
      typeIndex = i
      break
    }
  }

  if (!manualType || typeIndex < 2) return null

  // Model is everything between make and the type keyword
  const model = parts.slice(1, typeIndex).join('')

  // Year is any 4-digit number after the type keyword
  let year: number | null = null
  for (let i = typeIndex + 1; i < parts.length; i++) {
    const num = parseInt(parts[i], 10)
    if (!isNaN(num) && num >= 1900 && num <= 2100) {
      year = num
      break
    }
  }

  return { make, model, manualType, year }
}

// --- Normalization ---

/** Normalize a string for fuzzy matching: lowercase, remove spaces/hyphens/punctuation */
export function normalizeForMatch(str: string): string {
  return str.toLowerCase().replace(/[\s\-_.]/g, '')
}

// --- Local Filesystem Scanning ---

export interface LocalManualFile {
  filename: string
  parsed: ParsedManualFilename
}

/**
 * Scan the `data/manuals/` directory for local PDF files.
 * Returns [] on Vercel or if the directory doesn't exist.
 */
export async function scanLocalManuals(): Promise<LocalManualFile[]> {
  try {
    const fs = await import('fs/promises')
    const path = await import('path')
    const manualsDir = path.join(process.cwd(), 'data', 'manuals')
    const files = await fs.readdir(manualsDir)

    const results: LocalManualFile[] = []
    for (const file of files) {
      const parsed = parseManualFilename(file)
      if (parsed) {
        results.push({ filename: file, parsed })
      }
    }
    return results
  } catch {
    // ENOENT on Vercel or if directory doesn't exist
    return []
  }
}

// --- Supabase Fetchers ---

export async function fetchMotorcycles(): Promise<Motorcycle[]> {
  const { createServerClient } = await import('@/lib/supabase/server')
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('motorcycles')
    .select('*')
    .order('make', { ascending: true })
    .order('model', { ascending: true })

  if (error) {
    console.error('Error fetching motorcycles:', error)
    throw new Error('Failed to fetch motorcycles')
  }
  return data || []
}

export async function fetchDocumentSources(): Promise<DocumentSource[]> {
  const { createServerClient } = await import('@/lib/supabase/server')
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('document_sources')
    .select('*')

  if (error) {
    console.error('Error fetching document sources:', error)
    throw new Error('Failed to fetch document sources')
  }
  return data || []
}

// --- Coverage Matrix Builder ---

/** Check if a local manual file matches a given make+model */
function localFileMatchesModel(
  file: LocalManualFile,
  make: string,
  model: string
): boolean {
  const normalizedFileMake = normalizeForMatch(file.parsed.make)
  const normalizedFileModel = normalizeForMatch(file.parsed.model)
  const normalizedMake = normalizeForMatch(make)
  const normalizedModel = normalizeForMatch(model)

  return normalizedFileMake === normalizedMake && normalizedFileModel === normalizedModel
}

/** Check if a document source matches a given model group */
function docSourceMatchesModel(
  doc: DocumentSource,
  motorcycleIds: string[],
  make: string,
  model: string
): boolean {
  // Direct motorcycle_id match
  if (doc.motorcycle_id && motorcycleIds.includes(doc.motorcycle_id)) {
    return true
  }
  // Fall back to make+model text match
  if (doc.make && doc.model) {
    return (
      normalizeForMatch(doc.make) === normalizeForMatch(make) &&
      normalizeForMatch(doc.model) === normalizeForMatch(model)
    )
  }
  return false
}

function createEmptyCell(): ManualCoverageCell {
  return { status: 'missing', localFiles: [], documentSources: [] }
}

/**
 * Build the full coverage matrix from motorcycles, document sources, and local files.
 * This is a pure function — no side effects, easy to test.
 */
export function buildCoverageMatrix(
  motorcycles: Motorcycle[],
  documentSources: DocumentSource[],
  localManuals: LocalManualFile[]
): { rows: ModelCoverageRow[]; summary: CoverageSummary } {
  // Group motorcycles by normalized make+model
  const modelGroups = new Map<
    string,
    { make: string; model: string; ids: string[]; yearStart: number; yearEnd: number | null; category: string | null }
  >()

  for (const moto of motorcycles) {
    const key = `${normalizeForMatch(moto.make)}|${normalizeForMatch(moto.model)}`
    const existing = modelGroups.get(key)
    if (existing) {
      existing.ids.push(moto.id)
      existing.yearStart = Math.min(existing.yearStart, moto.year_start)
      if (moto.year_end !== null) {
        existing.yearEnd =
          existing.yearEnd !== null
            ? Math.max(existing.yearEnd, moto.year_end)
            : moto.year_end
      }
    } else {
      modelGroups.set(key, {
        make: moto.make,
        model: moto.model,
        ids: [moto.id],
        yearStart: moto.year_start,
        yearEnd: moto.year_end,
        category: moto.category,
      })
    }
  }

  // Build rows
  const rows: ModelCoverageRow[] = []
  let filledCells = 0
  const totalCells = modelGroups.size * MANUAL_TYPES.length

  for (const group of modelGroups.values()) {
    const coverage = {} as Record<ManualType, ManualCoverageCell>

    let rowDocs = 0

    for (const manualType of MANUAL_TYPES) {
      const cell = createEmptyCell()

      // Check document_sources for this model + manual_type
      const matchingDocs = documentSources.filter(
        (doc) =>
          doc.manual_type === manualType &&
          docSourceMatchesModel(doc, group.ids, group.make, group.model)
      )
      for (const doc of matchingDocs) {
        cell.documentSources.push({
          id: doc.id,
          title: doc.title,
          processing_status: doc.processing_status,
        })
      }

      // Check local files for this model + manual_type
      const matchingFiles = localManuals.filter(
        (file) =>
          file.parsed.manualType === manualType &&
          localFileMatchesModel(file, group.make, group.model)
      )
      for (const file of matchingFiles) {
        cell.localFiles.push(file.filename)
      }

      // Determine status
      if (cell.documentSources.length > 0) {
        cell.status = 'ingested'
        filledCells++
      } else if (cell.localFiles.length > 0) {
        cell.status = 'local_only'
        filledCells++
      } else {
        cell.status = 'missing'
      }

      rowDocs += cell.documentSources.length + cell.localFiles.length
      coverage[manualType] = cell
    }

    const yearRange = group.yearEnd
      ? `${group.yearStart}-${group.yearEnd}`
      : `${group.yearStart}+`

    rows.push({
      make: group.make,
      model: group.model,
      motorcycleIds: group.ids,
      yearRange,
      category: group.category,
      coverage,
      totalDocs: rowDocs,
    })
  }

  // Sort: make ASC, then model ASC
  rows.sort((a, b) => {
    const makeCompare = a.make.localeCompare(b.make)
    if (makeCompare !== 0) return makeCompare
    return a.model.localeCompare(b.model)
  })

  const modelsWithManuals = rows.filter((row) =>
    MANUAL_TYPES.some((type) => row.coverage[type].status !== 'missing')
  ).length

  const summary: CoverageSummary = {
    modelsWithManuals,
    totalModels: rows.length,
    totalDocumentSources: documentSources.length,
    localPdfCount: localManuals.length,
    overallCoveragePercent: totalCells > 0 ? Math.round((filledCells / totalCells) * 100) : 0,
  }

  return { rows, summary }
}
