/**
 * Vector Similarity Search
 *
 * Wraps the Supabase match_document_chunks RPC function for
 * performing semantic search against embedded document chunks.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type { VectorSearchParams, VectorSearchResult } from './rag.types'

/** Default number of results to return */
const DEFAULT_MATCH_COUNT = 10

/** Default similarity threshold (0-1, higher = more similar) */
const DEFAULT_SIMILARITY_THRESHOLD = 0.5

/** Row shape returned by the match_document_chunks RPC function */
type MatchChunkRow = Database['public']['Functions']['match_document_chunks']['Returns'][number]

/**
 * Performs a vector similarity search against the document_chunks table.
 *
 * Calls the match_document_chunks Postgres function via Supabase RPC.
 * Supports filtering by motorcycle_id, make, model, and content_type.
 *
 * @param supabase - Supabase client (server or anon)
 * @param params - Search parameters including the query embedding and optional filters
 * @returns Array of matching chunks sorted by similarity (highest first)
 * @throws Error if the RPC call fails
 */
export async function searchDocumentChunks(
  supabase: SupabaseClient<Database>,
  params: VectorSearchParams
): Promise<VectorSearchResult[]> {
  const {
    queryEmbedding,
    matchCount = DEFAULT_MATCH_COUNT,
    filters = {},
    similarityThreshold = DEFAULT_SIMILARITY_THRESHOLD,
  } = params

  // PostgREST expects pgvector values as a JSON string representation
  const embeddingStr = JSON.stringify(queryEmbedding)

  // Type assertion needed: Supabase's generic RPC typing doesn't resolve
  // cleanly with pgvector parameter types. This is a known limitation.
  const { data, error } = await (supabase.rpc as CallableFunction)(
    'match_document_chunks',
    {
      query_embedding: embeddingStr,
      match_count: matchCount,
      filter_motorcycle_id: filters.motorcycleId ?? null,
      filter_make: filters.make ?? null,
      filter_model: filters.model ?? null,
      filter_content_type: filters.contentType ?? null,
      similarity_threshold: similarityThreshold,
    }
  ) as { data: MatchChunkRow[] | null; error: { message: string } | null }

  if (error) {
    throw new Error(`Vector search failed: ${error.message}`)
  }

  if (!data) {
    return []
  }

  return data.map((row) => ({
    id: row.id,
    content: row.content,
    sectionTitle: row.section_title,
    sectionHierarchy: row.section_hierarchy,
    pageNumbers: row.page_numbers,
    contentType: row.content_type,
    make: row.make,
    model: row.model,
    similarity: row.similarity,
  }))
}
