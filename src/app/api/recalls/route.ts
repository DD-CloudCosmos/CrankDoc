import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { fetchNhtsaRecalls, mapNhtsaToRecall } from '@/lib/recalls/nhtsaClient'
import type { Recall, Database } from '@/types/database.types'

type RecallInsert = Database['public']['Tables']['recalls']['Insert']

interface RecallsApiResponse {
  recalls: Recall[]
  total: number
  page: number
  totalPages: number
}

export async function GET(request: Request): Promise<NextResponse<RecallsApiResponse | { error: string }>> {
  const { searchParams } = new URL(request.url)
  const make = searchParams.get('make') || ''
  const model = searchParams.get('model') || ''
  const year = searchParams.get('year') || ''
  const q = searchParams.get('q') || ''
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))

  const offset = (page - 1) * limit

  try {
    const supabase = createServerClient()

    const executeQuery = async () => {
      let query = supabase
        .from('recalls')
        .select('*', { count: 'exact' })

      if (make) {
        query = query.ilike('make', make)
      }

      if (model) {
        query = query.ilike('model', `%${model}%`)
      }

      if (year) {
        query = query.eq('model_year', parseInt(year, 10))
      }

      if (q) {
        query = query.or(`component.ilike.%${q}%,summary.ilike.%${q}%,consequence.ilike.%${q}%,nhtsa_campaign_number.ilike.%${q}%`)
      }

      return query
        .order('report_received_date', { ascending: false })
        .range(offset, offset + limit - 1)
    }

    const { data, error, count } = await executeQuery()

    if (error) {
      console.error('Error fetching recalls:', error)
      return NextResponse.json({ error: 'Failed to fetch recalls' }, { status: 500 })
    }

    // Cache-through: if no results and make+model+year are all provided, try live NHTSA fetch
    if ((!data || data.length === 0) && make && model && year) {
      try {
        const nhtsaResults = await fetchNhtsaRecalls(make, model, parseInt(year, 10))

        if (nhtsaResults.length > 0) {
          const rows: RecallInsert[] = nhtsaResults.map(mapNhtsaToRecall)
          await supabase.from('recalls').upsert(rows as never, {
            onConflict: 'nhtsa_campaign_number,model_year,data_source',
          })

          // Re-query to get stored data with IDs
          const { data: freshData, error: freshError, count: freshCount } = await executeQuery()

          if (freshError) {
            console.error('Error fetching recalls after NHTSA upsert:', freshError)
            return NextResponse.json({ error: 'Failed to fetch recalls' }, { status: 500 })
          }

          const freshTotal = freshCount ?? 0
          const freshTotalPages = Math.ceil(freshTotal / limit)

          return NextResponse.json({
            recalls: freshData ?? [],
            total: freshTotal,
            page,
            totalPages: freshTotalPages,
          })
        }
      } catch {
        // NHTSA fetch failed — fall through and return empty results
      }
    }

    const total = count ?? 0
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      recalls: data ?? [],
      total,
      page,
      totalPages,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
