/**
 * Document Parser
 *
 * Extracts text from different document types (PDFs, web pages, manual text
 * entry) and normalizes them into a common ParsedDocument structure for
 * downstream chunking and embedding.
 *
 * Uses dynamic imports for pdf-parse (dev dependency) and Node.js crypto
 * for SHA-256 hashing.
 */

import { createHash } from 'crypto'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single parsed page of text content. */
export interface ParsedPage {
  pageNumber: number
  text: string
  /** true if OCR was likely needed (very little extractable text) */
  isScanned: boolean
}

/** Normalized result of parsing any supported document type. */
export interface ParsedDocument {
  pages: ParsedPage[]
  totalPages: number
  title: string
  metadata: {
    sourceType: 'pdf' | 'scan' | 'web' | 'manual_entry'
    fileHash: string | null
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Pages with fewer than this many characters of extracted text are considered
 * scanned (i.e., image-based rather than text-based).
 */
const SCANNED_PAGE_CHAR_THRESHOLD = 100

// ---------------------------------------------------------------------------
// PDF Parsing
// ---------------------------------------------------------------------------

/**
 * Parses a PDF buffer into a ParsedDocument.
 *
 * Uses pdf-parse v2's class-based API for text extraction. Detects scanned
 * pages by checking if page text length falls below the threshold.
 * Falls back to an empty document if pdf-parse fails.
 */
export async function parsePdf(buffer: Buffer): Promise<ParsedDocument> {
  const fileHash = await computeFileHash(buffer)

  try {
    const { PDFParse } = await import('pdf-parse')
    const parser = new PDFParse({ data: new Uint8Array(buffer) })
    const textResult = await parser.getText()
    const infoResult = await parser.getInfo()

    const totalPages = textResult.total || 1
    const fullText = textResult.text || ''
    const title = infoResult.info?.Title || 'Untitled PDF'

    // Use per-page results from pdf-parse v2 when available
    let pages: ParsedPage[]

    if (textResult.pages && textResult.pages.length > 0) {
      pages = textResult.pages.map((page) => {
        const trimmedText = page.text.trim()
        const isScanned = trimmedText.length < SCANNED_PAGE_CHAR_THRESHOLD
        return {
          pageNumber: page.num,
          text: trimmedText,
          isScanned,
        }
      })
    } else {
      // Fallback: split full text by form-feed character
      const rawPages = fullText.includes('\f')
        ? fullText.split('\f')
        : [fullText]

      pages = rawPages.map((text, index) => {
        const trimmedText = text.trim()
        const isScanned = trimmedText.length < SCANNED_PAGE_CHAR_THRESHOLD
        return {
          pageNumber: index + 1,
          text: trimmedText,
          isScanned,
        }
      })
    }

    // Determine if the whole document appears to be scanned
    const averageCharsPerPage = fullText.length / totalPages
    const isWholeDocScanned = averageCharsPerPage < SCANNED_PAGE_CHAR_THRESHOLD

    await parser.destroy()

    return {
      pages,
      totalPages,
      title,
      metadata: {
        sourceType: isWholeDocScanned ? 'scan' : 'pdf',
        fileHash,
      },
    }
  } catch {
    // pdf-parse failed — return a minimal empty document
    return {
      pages: [],
      totalPages: 0,
      title: 'Untitled PDF',
      metadata: {
        sourceType: 'pdf',
        fileHash,
      },
    }
  }
}

// ---------------------------------------------------------------------------
// Manual Entry Parsing
// ---------------------------------------------------------------------------

/**
 * Wraps plain text input into the ParsedDocument structure.
 *
 * Treats the entire text as a single "page". Useful for content that a
 * user types or pastes directly into the application.
 */
export async function parseManualEntry(
  text: string,
  title: string
): Promise<ParsedDocument> {
  const trimmed = text.trim()

  if (!trimmed) {
    return {
      pages: [],
      totalPages: 0,
      title,
      metadata: {
        sourceType: 'manual_entry',
        fileHash: null,
      },
    }
  }

  return {
    pages: [
      {
        pageNumber: 1,
        text: trimmed,
        isScanned: false,
      },
    ],
    totalPages: 1,
    title,
    metadata: {
      sourceType: 'manual_entry',
      fileHash: null,
    },
  }
}

// ---------------------------------------------------------------------------
// Web Content Parsing
// ---------------------------------------------------------------------------

/**
 * Strips HTML tags and extracts readable text content.
 *
 * Removes script/style blocks entirely, strips remaining tags, collapses
 * whitespace, and decodes common HTML entities. Uses regex-based stripping
 * rather than an external DOM library (sufficient for Phase 1).
 */
export async function parseWebContent(
  html: string,
  title: string
): Promise<ParsedDocument> {
  const cleanedText = stripHtml(html)

  if (!cleanedText) {
    return {
      pages: [],
      totalPages: 0,
      title,
      metadata: {
        sourceType: 'web',
        fileHash: null,
      },
    }
  }

  return {
    pages: [
      {
        pageNumber: 1,
        text: cleanedText,
        isScanned: false,
      },
    ],
    totalPages: 1,
    title,
    metadata: {
      sourceType: 'web',
      fileHash: null,
    },
  }
}

/**
 * Regex-based HTML stripper. Removes script and style blocks, strips tags,
 * decodes common entities, and collapses whitespace.
 */
function stripHtml(html: string): string {
  let text = html

  // Remove <script> and <style> blocks entirely (including content)
  text = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, '')

  // Replace block-level closing tags with newlines for readability
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|br)\s*>/gi, '\n')
  text = text.replace(/<br\s*\/?>/gi, '\n')

  // Strip all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '')

  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')

  // Collapse multiple spaces/tabs into a single space
  text = text.replace(/[ \t]+/g, ' ')

  // Collapse multiple newlines into at most two
  text = text.replace(/\n{3,}/g, '\n\n')

  // Trim leading/trailing whitespace per line and overall
  text = text
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim()

  return text
}

// ---------------------------------------------------------------------------
// File Hashing
// ---------------------------------------------------------------------------

/**
 * Computes a SHA-256 hash of a buffer for deduplication.
 *
 * Returns the hash as a lowercase hexadecimal string.
 */
export async function computeFileHash(buffer: Buffer): Promise<string> {
  const hash = createHash('sha256')
  hash.update(buffer)
  return hash.digest('hex')
}
