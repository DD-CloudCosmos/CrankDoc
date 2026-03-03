/**
 * Manual Coverage — Server-Only Functions
 *
 * Supabase fetchers and filesystem scanning for the admin manual coverage dashboard.
 * These use Node.js APIs (fs, path) and Supabase server client — only import from
 * Server Components and API routes, never from client components.
 */

import { createServerClient } from '@/lib/supabase/server'
import { parseManualFilename } from '@/lib/manuals'
import type { Motorcycle, DocumentSource } from '@/types/database.types'
import type { LocalManualFile } from '@/lib/manuals'

// --- Local Filesystem Scanning ---

/**
 * Scan the `data/manuals/` directory for local PDF files.
 * Returns [] on Vercel or if the directory doesn't exist.
 *
 * Accepts an optional `readDir` function for testing.
 */
export async function scanLocalManuals(
  readDir?: (dir: string) => Promise<string[]>
): Promise<LocalManualFile[] | null> {
  try {
    const reader = readDir ?? (async (dir: string) => {
      const fs = await import('fs/promises')
      const entries = await fs.readdir(dir)
      return entries as string[]
    })

    const path = await import('path')
    const manualsDir = path.join(process.cwd(), 'data', 'manuals')
    const files = await reader(manualsDir)

    const results: LocalManualFile[] = []
    for (const file of files) {
      const parsed = parseManualFilename(file)
      if (parsed) {
        results.push({ filename: file, parsed })
      }
    }
    return results
  } catch {
    // ENOENT on Vercel or if directory doesn't exist — return null to distinguish
    // from "directory exists but no parseable files" (which returns [])
    return null
  }
}

// --- Supabase Fetchers ---

export async function fetchMotorcycles(): Promise<Motorcycle[]> {
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
