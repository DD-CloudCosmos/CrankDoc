import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { DtcCode } from '@/types/database.types'

interface DtcApiResponse {
  codes: DtcCode[]
  total: number
  page: number
  totalPages: number
}

export async function GET(request: Request): Promise<NextResponse<DtcApiResponse | { error: string }>> {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''
  const category = searchParams.get('category') || ''
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))

  const offset = (page - 1) * limit

  try {
    const supabase = createServerClient()

    let query = supabase
      .from('dtc_codes')
      .select('*', { count: 'exact' })

    if (q) {
      query = query.or(`code.ilike.%${q}%,description.ilike.%${q}%`)
    }

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error, count } = await query
      .order('code')
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching DTC codes:', error)
      return NextResponse.json({ error: 'Failed to fetch DTC codes' }, { status: 500 })
    }

    const total = count ?? 0
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      codes: data ?? [],
      total,
      page,
      totalPages,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
