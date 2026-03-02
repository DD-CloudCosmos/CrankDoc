/**
 * RAG Query API Route
 *
 * Handles semantic search queries against the CrankDoc document corpus.
 * Generates embeddings for the user query, performs vector similarity search,
 * assembles context from matched chunks, and streams an AI-generated answer.
 *
 * POST /api/rag/query
 */

import { NextResponse } from 'next/server'
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { createServerClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/rag/embeddings'
import { searchDocumentChunks } from '@/lib/rag/vectorSearch'
import {
  CRANKDOC_RAG_SYSTEM_PROMPT,
  assembleRagPrompt,
} from '@/lib/rag/prompts'
import type { RagQueryRequest, VectorSearchFilters } from '@/lib/rag/rag.types'

/** Default number of results when not specified by the client */
const DEFAULT_MAX_RESULTS = 5

/** Absolute maximum results allowed per request */
const MAX_RESULTS_LIMIT = 20

/** Minimum allowed maxResults value */
const MIN_RESULTS_LIMIT = 1

/**
 * Validates the incoming request body and returns a typed request
 * or an error response.
 */
function validateRequestBody(
  body: unknown
): { valid: true; data: RagQueryRequest } | { valid: false; error: string } {
  if (typeof body !== 'object' || body === null) {
    return { valid: false, error: 'Request body must be a JSON object' }
  }

  const rawBody = body as Record<string, unknown>

  // Validate query field
  if (!('query' in rawBody) || typeof rawBody.query !== 'string') {
    return { valid: false, error: 'Missing required field: query' }
  }

  const query = rawBody.query.trim()
  if (query.length === 0) {
    return { valid: false, error: 'Query must be a non-empty string' }
  }

  // Validate maxResults if provided
  let maxResults = DEFAULT_MAX_RESULTS
  if ('maxResults' in rawBody && rawBody.maxResults !== undefined) {
    if (typeof rawBody.maxResults !== 'number' || !Number.isInteger(rawBody.maxResults)) {
      return { valid: false, error: 'maxResults must be an integer between 1 and 20' }
    }
    if (rawBody.maxResults < MIN_RESULTS_LIMIT || rawBody.maxResults > MAX_RESULTS_LIMIT) {
      return {
        valid: false,
        error: `maxResults must be between ${MIN_RESULTS_LIMIT} and ${MAX_RESULTS_LIMIT}`,
      }
    }
    maxResults = rawBody.maxResults
  }

  // Validate optional string fields
  const optionalStringFields = ['motorcycleId', 'make', 'model', 'contentType'] as const
  for (const field of optionalStringFields) {
    if (field in rawBody && rawBody[field] !== undefined && typeof rawBody[field] !== 'string') {
      return { valid: false, error: `${field} must be a string` }
    }
  }

  return {
    valid: true,
    data: {
      query,
      motorcycleId: rawBody.motorcycleId as string | undefined,
      make: rawBody.make as string | undefined,
      model: rawBody.model as string | undefined,
      contentType: rawBody.contentType as string | undefined,
      maxResults,
    },
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    )
  }

  const validation = validateRequestBody(body)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const { query, motorcycleId, make, model, contentType, maxResults } =
    validation.data

  // Step 1: Generate embedding for the query
  let queryEmbedding: number[]
  try {
    const embeddingResult = await generateEmbedding(query)
    queryEmbedding = embeddingResult.embedding
  } catch (error) {
    console.error('Embedding generation failed:', error)
    return NextResponse.json(
      { error: 'Failed to generate query embedding' },
      { status: 500 }
    )
  }

  // Step 2: Search for similar document chunks
  const filters: VectorSearchFilters = {}
  if (motorcycleId) filters.motorcycleId = motorcycleId
  if (make) filters.make = make
  if (model) filters.model = model
  if (contentType) filters.contentType = contentType

  let chunks
  try {
    const supabase = createServerClient()
    chunks = await searchDocumentChunks(supabase, {
      queryEmbedding,
      matchCount: maxResults,
      filters,
    })
  } catch (error) {
    console.error('Vector search failed:', error)
    return NextResponse.json(
      { error: 'Failed to search document chunks' },
      { status: 500 }
    )
  }

  // Step 3: Handle no results
  if (chunks.length === 0) {
    return NextResponse.json({
      answer:
        "I don't have any relevant reference materials to answer that question. Try rephrasing your query or adjusting the filters.",
      sources: [],
    })
  }

  // Step 4: Assemble prompt and stream the LLM response
  const userPrompt = assembleRagPrompt(query, chunks)

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: CRANKDOC_RAG_SYSTEM_PROMPT,
    prompt: userPrompt,
    maxOutputTokens: 2000,
  })

  return result.toTextStreamResponse()
}
