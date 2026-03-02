/**
 * Motorcycle-Manual-Aware Text Chunking Module
 *
 * Splits parsed document text into semantically meaningful chunks
 * optimized for motorcycle service manuals. Handles spec tables,
 * torque tables, procedures, diagram captions, wiring info, and prose.
 *
 * Pure functions only — no I/O, no network, no side effects.
 */

/** Locally defined to avoid circular dependency with parser module */
type ParsedPage = {
  pageNumber: number
  text: string
  isScanned: boolean
}

/** A single chunk produced by the chunking pipeline */
export interface ChunkResult {
  content: string
  chunkIndex: number
  contentType: 'prose' | 'spec_table' | 'procedure' | 'diagram_caption' | 'torque_table' | 'wiring_info'
  sectionTitle: string | null
  sectionHierarchy: string[]
  pageNumbers: number[]
  contentLength: number
}

/** Metadata about the source document being chunked */
export interface DocumentMetadata {
  make: string
  model: string
  yearStart: number
  yearEnd: number | null
  manualType: string
}

// ---------------------------------------------------------------------------
// Constants — chunk sizing in approximate characters (1 token ≈ 4 chars)
// ---------------------------------------------------------------------------

/** Target chunk size in characters (~800 tokens) */
export const TARGET_CHUNK_CHARS = 3200

/** Maximum chunk size in characters (~1200 tokens) */
const MAX_CHUNK_CHARS = 4800

/** Overlap between consecutive chunks in characters (~100 tokens) */
const OVERLAP_CHARS = 400

/** Minimum chunk size in characters (~100 tokens) */
const MIN_CHUNK_CHARS = 400

// ---------------------------------------------------------------------------
// Regex patterns for content type detection
// ---------------------------------------------------------------------------

/** Units commonly found in spec tables */
const SPEC_UNITS_RE = /\b\d+[\d.]*\s*(?:Nm|mm|cc|mL|L|psi|bar|kg|lb|in|°C|°F|kPa|MPa)\b/gi

/** Torque-specific patterns */
const TORQUE_RE = /\b\d+[\d.]*\s*(?:Nm|lb[·\-\s]?ft|ft[·\-\s]?lb|N·m|kgf·m)\b/gi

/** Procedure step patterns */
const PROCEDURE_STEP_RE = /(?:^|\n)\s*(?:Step\s+\d+|(?:\d{1,2})\.\s+[A-Z])|(?:^|\n)\s*(?:WARNING|CAUTION|NOTE|IMPORTANT)\s*[:\-!]/im

/** Diagram caption patterns */
const DIAGRAM_CAPTION_RE = /\b(?:Fig(?:ure)?|Diagram|Illustration)\s*[\d.\-]+/i

/** Wire color code patterns (e.g., R/W, BL/Y, Br/G) */
const WIRE_COLOR_RE = /\b(?:R|BL|Br|G|Y|W|B|O|P|Lg|V|Gr)\/(?:R|BL|Br|G|Y|W|B|O|P|Lg|V|Gr)\b/

/** Wiring-related keywords */
const WIRING_KEYWORDS_RE = /\b(?:connector|terminal|harness|wire|wiring|pin(?:out)?|ECU|CDI|ECM)\b/i

/** Section heading: ALL CAPS line, short length */
const ALL_CAPS_HEADING_RE = /^([A-Z][A-Z\s/\-&]{2,58}[A-Z])$/m

/** Section heading: "Chapter N" or "Section N" */
const CHAPTER_HEADING_RE = /^(?:Chapter|Section)\s+\d+[\s:.\-].{1,50}$/im

/** Section heading: numbered section like "3.2 Something" */
const NUMBERED_SECTION_RE = /^(\d{1,3}(?:\.\d{1,3}){0,3})\s+([A-Z].{1,55})$/m

// ---------------------------------------------------------------------------
// Content type detection
// ---------------------------------------------------------------------------

/**
 * Detects the content type of a text block based on structural patterns.
 *
 * Priority order (most specific first):
 * 1. torque_table — torque keyword + Nm/lb-ft values
 * 2. procedure — numbered steps or WARNING/CAUTION markers (checked before
 *    spec_table because procedures often contain inline measurements)
 * 3. spec_table — multiple lines with numeric values and units
 * 4. diagram_caption — short text with figure/diagram references
 * 5. wiring_info — wire color codes or connector/terminal references
 * 6. prose — everything else
 */
export function detectContentType(text: string): ChunkResult['contentType'] {
  const lowerText = text.toLowerCase()

  // Torque table: "torque" nearby + Nm/lb-ft values
  const hasTorqueKeyword = lowerText.includes('torque')
  const torqueMatches = text.match(TORQUE_RE)
  if (hasTorqueKeyword && torqueMatches && torqueMatches.length >= 1) {
    return 'torque_table'
  }

  // Procedure: numbered steps or safety markers
  // Checked before spec_table because procedures commonly contain
  // inline measurements (e.g., "16mm socket", "0.6-0.7mm gap")
  // that would trigger false spec_table detection.
  if (PROCEDURE_STEP_RE.test(text)) {
    return 'procedure'
  }

  // Spec table: multiple lines with numbers and units
  const specMatches = text.match(SPEC_UNITS_RE)
  if (specMatches && specMatches.length >= 2) {
    return 'spec_table'
  }

  // Diagram caption: short text with figure references
  if (DIAGRAM_CAPTION_RE.test(text) && text.length < 300) {
    return 'diagram_caption'
  }

  // Wiring info: wire color codes or wiring keywords + connector/terminal
  const hasWireColors = WIRE_COLOR_RE.test(text)
  const hasWiringKeywords = WIRING_KEYWORDS_RE.test(text)
  if (hasWireColors && hasWiringKeywords) {
    return 'wiring_info'
  }

  return 'prose'
}

// ---------------------------------------------------------------------------
// Section title detection
// ---------------------------------------------------------------------------

/**
 * Detects section headings in text.
 *
 * Looks for:
 * - ALL CAPS lines under 60 characters
 * - "Chapter N:" or "Section N:" headings
 * - Numbered sections like "3.2 Valve Train"
 *
 * Returns the first detected heading or null.
 */
export function detectSectionTitle(text: string): string | null {
  // Check for ALL CAPS heading
  const capsMatch = text.match(ALL_CAPS_HEADING_RE)
  if (capsMatch) {
    return capsMatch[1].trim()
  }

  // Check for Chapter/Section heading
  const chapterMatch = text.match(CHAPTER_HEADING_RE)
  if (chapterMatch) {
    return chapterMatch[0].trim()
  }

  // Check for numbered section heading
  const numberedMatch = text.match(NUMBERED_SECTION_RE)
  if (numberedMatch) {
    return numberedMatch[0].trim()
  }

  return null
}

// ---------------------------------------------------------------------------
// Metadata prefix builder
// ---------------------------------------------------------------------------

/**
 * Builds a metadata prefix string for embedding context.
 *
 * Format: [{make} {model} {yearStart}-{yearEnd} | {manualType} | {sectionTitle}]
 *
 * This prefix is used to give the embedding model additional context
 * but is NOT stored in the chunk content field.
 */
export function buildMetadataPrefix(
  metadata: DocumentMetadata,
  sectionTitle: string | null
): string {
  const yearRange = metadata.yearEnd
    ? `${metadata.yearStart}-${metadata.yearEnd}`
    : `${metadata.yearStart}`

  const parts = [
    `${metadata.make} ${metadata.model} ${yearRange}`,
    metadata.manualType,
  ]

  if (sectionTitle) {
    parts.push(sectionTitle)
  }

  return `[${parts.join(' | ')}]`
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Determines whether a text block is a table (spec or torque) that
 * should not be split mid-content.
 */
function isAtomicTable(contentType: ChunkResult['contentType']): boolean {
  return contentType === 'spec_table' || contentType === 'torque_table'
}

/**
 * Splits text into paragraphs using double newlines as boundaries.
 * Preserves single newlines within paragraphs.
 */
function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}

/**
 * Splits procedure text at step boundaries.
 * Each step starts with a line matching "Step N", "N." or a safety marker.
 */
function splitProcedureAtSteps(text: string): string[] {
  const stepBoundary = /(?=(?:^|\n)\s*(?:Step\s+\d+|\d{1,2}\.\s+[A-Z]|(?:WARNING|CAUTION|NOTE|IMPORTANT)\s*[:\-!]))/im
  return text
    .split(stepBoundary)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/**
 * Joins a segment array back together, respecting paragraph boundaries.
 */
function joinSegments(segments: string[]): string {
  return segments.join('\n\n')
}

/**
 * Builds chunks from a list of text segments (paragraphs or steps),
 * respecting target/max size and overlap.
 */
function buildChunksFromSegments(
  segments: string[],
  pageNumbers: number[]
): Array<{ content: string; pageNumbers: number[] }> {
  const result: Array<{ content: string; pageNumbers: number[] }> = []

  let currentSegments: string[] = []
  let currentLength = 0

  for (const segment of segments) {
    const segmentLength = segment.length
    const joinOverhead = currentSegments.length > 0 ? 2 : 0 // "\n\n" between segments

    // If adding this segment would exceed max, flush current chunk
    if (currentLength + segmentLength + joinOverhead > MAX_CHUNK_CHARS && currentSegments.length > 0) {
      result.push({
        content: joinSegments(currentSegments),
        pageNumbers: [...pageNumbers],
      })

      // Overlap: keep the last segment(s) that fit within OVERLAP_CHARS
      const overlapSegments: string[] = []
      let overlapLen = 0
      for (let i = currentSegments.length - 1; i >= 0; i--) {
        const sLen = currentSegments[i].length + (overlapSegments.length > 0 ? 2 : 0)
        if (overlapLen + sLen > OVERLAP_CHARS) break
        overlapSegments.unshift(currentSegments[i])
        overlapLen += sLen
      }

      currentSegments = overlapSegments
      currentLength = overlapLen
    }

    currentSegments.push(segment)
    currentLength += segmentLength + joinOverhead
  }

  // Flush remaining content
  if (currentSegments.length > 0) {
    result.push({
      content: joinSegments(currentSegments),
      pageNumbers: [...pageNumbers],
    })
  }

  return result
}

// ---------------------------------------------------------------------------
// Page-to-section mapping helpers
// ---------------------------------------------------------------------------

interface PageSection {
  pageNumber: number
  text: string
  sectionTitle: string | null
  sectionHierarchy: string[]
}

/**
 * Assigns section titles and hierarchy to each page based on detected headings.
 * Section context carries forward from page to page when no new heading is found.
 */
function assignSections(pages: ParsedPage[]): PageSection[] {
  let currentTitle: string | null = null
  const currentHierarchy: string[] = []

  return pages.map((page) => {
    const detected = detectSectionTitle(page.text)
    if (detected) {
      currentTitle = detected

      // Build hierarchy: add new title if not already the last entry
      if (currentHierarchy.length === 0 || currentHierarchy[currentHierarchy.length - 1] !== detected) {
        // Simple heuristic: if new title looks like a sub-section (numbered),
        // add it; otherwise replace the last entry
        const isNumbered = /^\d{1,3}\./.test(detected)
        if (isNumbered && currentHierarchy.length > 0) {
          // Keep the parent, replace any previous sub-section
          if (currentHierarchy.length > 1) {
            currentHierarchy[currentHierarchy.length - 1] = detected
          } else {
            currentHierarchy.push(detected)
          }
        } else {
          // Top-level heading: reset hierarchy
          currentHierarchy.length = 0
          currentHierarchy.push(detected)
        }
      }
    }

    return {
      pageNumber: page.pageNumber,
      text: page.text,
      sectionTitle: currentTitle,
      sectionHierarchy: [...currentHierarchy],
    }
  })
}

// ---------------------------------------------------------------------------
// Main chunking function
// ---------------------------------------------------------------------------

/**
 * Chunks a parsed document into semantically meaningful pieces
 * optimized for motorcycle service manual content.
 *
 * Strategy:
 * 1. Assign section context to each page
 * 2. Group consecutive pages with the same section
 * 3. Within each group, detect content type and split accordingly:
 *    - Tables (spec/torque): kept as atomic units when under max size
 *    - Procedures: split at step boundaries
 *    - Prose: split at paragraph boundaries
 * 4. Apply target/max/min size constraints with overlap
 * 5. Tag each chunk with metadata
 */
export function chunkDocument(
  pages: ParsedPage[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  metadata: DocumentMetadata
): ChunkResult[] {
  // Note: metadata is accepted to keep the API consistent with the RAG pipeline.
  // Callers use buildMetadataPrefix(metadata, sectionTitle) to generate the
  // embedding prefix for each chunk. This function focuses on content chunking.

  // Filter out empty pages
  const nonEmptyPages = pages.filter((p) => p.text.trim().length > 0)

  if (nonEmptyPages.length === 0) {
    return []
  }

  // Step 1: Assign sections to each page
  const pageSections = assignSections(nonEmptyPages)

  // Step 2: Group consecutive pages by section title
  const groups: PageSection[][] = []
  let currentGroup: PageSection[] = []

  for (const ps of pageSections) {
    if (
      currentGroup.length > 0 &&
      currentGroup[currentGroup.length - 1].sectionTitle !== ps.sectionTitle
    ) {
      groups.push(currentGroup)
      currentGroup = []
    }
    currentGroup.push(ps)
  }
  if (currentGroup.length > 0) {
    groups.push(currentGroup)
  }

  // Step 3: Process each group into chunks
  const allChunks: ChunkResult[] = []
  let chunkIndex = 0

  for (const group of groups) {
    const combinedText = group.map((ps) => ps.text).join('\n\n')
    const pageNumbers = group.map((ps) => ps.pageNumber)
    const sectionTitle = group[0].sectionTitle
    const sectionHierarchy = group[0].sectionHierarchy

    const contentType = detectContentType(combinedText)

    // Tables: try to keep as atomic unit
    if (isAtomicTable(contentType)) {
      if (combinedText.length <= MAX_CHUNK_CHARS) {
        // Fits as a single chunk
        allChunks.push({
          content: combinedText.trim(),
          chunkIndex,
          contentType,
          sectionTitle,
          sectionHierarchy: [...sectionHierarchy],
          pageNumbers: [...pageNumbers],
          contentLength: combinedText.trim().length,
        })
        chunkIndex++
        continue
      }
      // Table too large — fall through to paragraph splitting
    }

    // Determine segments based on content type
    let segments: string[]
    if (contentType === 'procedure') {
      segments = splitProcedureAtSteps(combinedText)
    } else {
      segments = splitIntoParagraphs(combinedText)
    }

    // If we only have one segment and it's too short, just use it
    if (segments.length === 0) {
      continue
    }

    // Build chunks from segments
    const rawChunks = buildChunksFromSegments(
      segments,
      pageNumbers
    )

    for (const raw of rawChunks) {
      const trimmed = raw.content.trim()
      if (trimmed.length === 0) continue

      // Detect content type per chunk (may differ within a section)
      const chunkContentType = detectContentType(trimmed)

      allChunks.push({
        content: trimmed,
        chunkIndex,
        contentType: chunkContentType,
        sectionTitle,
        sectionHierarchy: [...sectionHierarchy],
        pageNumbers: raw.pageNumbers,
        contentLength: trimmed.length,
      })
      chunkIndex++
    }
  }

  // Step 4: Post-process — merge tiny trailing chunks into the previous chunk
  const finalChunks: ChunkResult[] = []
  for (let i = 0; i < allChunks.length; i++) {
    const chunk = allChunks[i]

    if (
      chunk.contentLength < MIN_CHUNK_CHARS &&
      i > 0 &&
      i === allChunks.length - 1
    ) {
      // Merge into the previous chunk if combined size is within max
      const prev = finalChunks[finalChunks.length - 1]
      const combined = prev.content + '\n\n' + chunk.content
      if (combined.length <= MAX_CHUNK_CHARS) {
        prev.content = combined
        prev.contentLength = combined.length
        // Merge page numbers
        const mergedPages = new Set([...prev.pageNumbers, ...chunk.pageNumbers])
        prev.pageNumbers = Array.from(mergedPages).sort((a, b) => a - b)
        continue
      }
    }

    finalChunks.push(chunk)
  }

  // Re-index chunks
  return finalChunks.map((chunk, idx) => ({
    ...chunk,
    chunkIndex: idx,
  }))
}
