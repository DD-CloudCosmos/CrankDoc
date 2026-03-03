/**
 * Manual Coverage — Server-Only Functions
 *
 * Supabase fetchers and Storage listing for the admin manual coverage dashboard.
 * Uses Supabase server client — only import from Server Components and API routes,
 * never from client components.
 */

import { createServerClient } from '@/lib/supabase/server'
import { parseManualFilename } from '@/lib/manuals'
import type { Motorcycle, DocumentSource } from '@/types/database.types'
import type { StorageManualFile } from '@/lib/manuals'

// --- Supabase Storage Listing ---

const STORAGE_BUCKET = 'service-manuals'

/**
 * List PDF files in the `service-manuals` Supabase Storage bucket.
 * Parses each filename to extract make/model/type metadata.
 * Returns null if the bucket doesn't exist or listing fails.
 */
export async function listStorageManuals(): Promise<StorageManualFile[] | null> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list('', { limit: 1000, sortBy: { column: 'name', order: 'asc' } })

    if (error) {
      console.error('Error listing storage manuals:', error.message)
      return null
    }

    if (!data) return null

    const results: StorageManualFile[] = []
    for (const file of data) {
      if (!file.name.endsWith('.pdf')) continue
      const parsed = parseManualFilename(file.name)
      if (parsed) {
        results.push({ filename: file.name, parsed })
      }
    }
    return results
  } catch {
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
