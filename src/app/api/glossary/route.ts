import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { GlossaryTerm } from '@/types/database.types'

interface GlossaryApiResponse {
  terms: GlossaryTerm[]
  total: number
  page: number
  totalPages: number
}

export async function GET(request: Request): Promise<NextResponse<GlossaryApiResponse | { error: string }>> {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''
  const category = searchParams.get('category') || ''
  const letter = searchParams.get('letter') || ''
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '30', 10)))

  const offset = (page - 1) * limit

  try {
    const supabase = createServerClient()

    let query = supabase
      .from('glossary_terms')
      .select('*', { count: 'exact' })

    if (q) {
      query = query.or(`term.ilike.%${q}%,definition.ilike.%${q}%`)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (letter) {
      query = query.ilike('term', `${letter}%`)
    }

    const { data, error, count } = await query
      .order('term')
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching glossary terms:', error)
      return NextResponse.json({ error: 'Failed to fetch glossary terms' }, { status: 500 })
    }

    const total = count ?? 0
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      terms: data ?? [],
      total,
      page,
      totalPages,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
