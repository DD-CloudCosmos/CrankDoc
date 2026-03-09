import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { SearchResponse, SearchResultItem } from '@/types/search.types'

export async function GET(request: Request): Promise<NextResponse<SearchResponse | { error: string }>> {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() || ''
  const limit = Math.min(10, Math.max(1, parseInt(searchParams.get('limit') || '3', 10)))

  if (!q || q.length < 2) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required and must be at least 2 characters' },
      { status: 400 }
    )
  }

  try {
    const supabase = createServerClient()

    // Run all 5 queries in parallel — partial failures return empty arrays
    const results = await Promise.allSettled([
      // 1. Motorcycles
      supabase
        .from('motorcycles')
        .select('id, make, model, year_start, year_end, category')
        .or(`model.ilike.%${q}%,make.ilike.%${q}%`)
        .limit(limit),

      // 2. DTC Codes
      supabase
        .from('dtc_codes')
        .select('id, code, description, manufacturer')
        .or(`code.ilike.%${q}%,description.ilike.%${q}%`)
        .limit(limit),

      // 3. Glossary Terms
      supabase
        .from('glossary_terms')
        .select('id, term, definition, slug')
        .or(`term.ilike.%${q}%,definition.ilike.%${q}%`)
        .limit(limit),

      // 4. Diagnostic Trees
      supabase
        .from('diagnostic_trees')
        .select('id, title, description, motorcycle_id')
        .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
        .limit(limit),

      // 5. Recalls
      supabase
        .from('recalls')
        .select('id, nhtsa_campaign_number, make, model, model_year, summary')
        .or(`summary.ilike.%${q}%,component.ilike.%${q}%`)
        .limit(limit),
    ])

    // Extract data from settled results, defaulting to empty arrays on failure
    const motorcyclesData = results[0].status === 'fulfilled' ? results[0].value.data ?? [] : []
    const dtcData = results[1].status === 'fulfilled' ? results[1].value.data ?? [] : []
    const glossaryData = results[2].status === 'fulfilled' ? results[2].value.data ?? [] : []
    const treesData = results[3].status === 'fulfilled' ? results[3].value.data ?? [] : []
    const recallsData = results[4].status === 'fulfilled' ? results[4].value.data ?? [] : []

    // Map each result set into SearchResultItem[]
    const bikes: SearchResultItem[] = motorcyclesData.map((m) => ({
      id: m.id,
      title: `${m.make} ${m.model}`,
      subtitle: `${m.year_start}${m.year_end ? `-${m.year_end}` : '-present'} ${m.category ?? ''}`.trim(),
      href: `/bikes/${m.id}`,
      category: 'bikes' as const,
    }))

    const dtcCodes: SearchResultItem[] = dtcData.map((d) => ({
      id: d.id,
      title: d.code,
      subtitle: d.description.length > 80 ? `${d.description.slice(0, 80)}...` : d.description,
      href: `/dtc?q=${encodeURIComponent(d.code)}`,
      category: 'dtcCodes' as const,
    }))

    const glossaryTerms: SearchResultItem[] = glossaryData.map((g) => ({
      id: g.id,
      title: g.term,
      subtitle: g.definition.length > 80 ? `${g.definition.slice(0, 80)}...` : g.definition,
      href: `/glossary?q=${encodeURIComponent(g.term)}`,
      category: 'glossaryTerms' as const,
    }))

    const diagnosticTrees: SearchResultItem[] = treesData.map((t) => ({
      id: t.id,
      title: t.title,
      subtitle: t.description
        ? t.description.length > 80 ? `${t.description.slice(0, 80)}...` : t.description
        : 'Diagnostic guide',
      href: `/diagnose?tree=${t.id}`,
      category: 'diagnosticTrees' as const,
    }))

    const recalls: SearchResultItem[] = recallsData.map((r) => ({
      id: r.id,
      title: `${r.make} ${r.model} (${r.model_year})`,
      subtitle: r.summary
        ? r.summary.length > 80 ? `${r.summary.slice(0, 80)}...` : r.summary
        : r.nhtsa_campaign_number,
      href: `/recalls?q=${encodeURIComponent(r.nhtsa_campaign_number)}`,
      category: 'recalls' as const,
    }))

    return NextResponse.json({ bikes, dtcCodes, glossaryTerms, diagnosticTrees, recalls })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
