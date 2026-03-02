/**
 * RAG Document Ingestion API Route
 *
 * Handles document upload status tracking. Actual ingestion is done
 * via the CLI script (scripts/ingest-document.ts) since it involves
 * heavy processing (PDF parsing, OCR, embedding generation).
 *
 * This route provides:
 * - GET: List document sources with their processing status
 * - POST: Create a new document source record (manual entry)
 */

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * GET /api/rag/ingest
 *
 * Returns a list of document sources with their processing status.
 * Supports optional filtering by status and pagination.
 *
 * Query params:
 * - status: filter by processing_status (pending, processing, completed, failed)
 * - limit: max results (default 20, max 100)
 * - offset: pagination offset (default 0)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const supabase = createServerClient()

    let query = supabase
      .from('document_sources')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('processing_status', status as 'pending' | 'processing' | 'completed' | 'failed')
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      documents: data,
      total: count,
      limit,
      offset,
    })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

interface ManualEntryBody {
  title: string
  content: string
  make?: string
  model?: string
  yearStart?: number
  yearEnd?: number
}

/**
 * POST /api/rag/ingest
 *
 * Creates a new document source from manual text entry.
 * For PDF uploads, use the CLI script instead.
 *
 * Body:
 * - title: string (required)
 * - content: string (required)
 * - make: string (optional)
 * - model: string (optional)
 * - yearStart: number (optional)
 * - yearEnd: number (optional)
 */
export async function POST(request: Request) {
  try {
    let body: ManualEntryBody
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
      return NextResponse.json(
        { error: 'title is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (!body.content || typeof body.content !== 'string' || !body.content.trim()) {
      return NextResponse.json(
        { error: 'content is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('document_sources')
      .insert({
        title: body.title.trim(),
        source_type: 'manual_entry' as const,
        make: body.make || null,
        model: body.model || null,
        year_start: body.yearStart || null,
        year_end: body.yearEnd || null,
        manual_type: null,
        total_pages: 1,
        processing_status: 'pending' as const,
      })
      .select('id, title, processing_status, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ document: data }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
