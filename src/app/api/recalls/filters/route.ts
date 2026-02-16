import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

interface FiltersResponse {
  makes: string[]
  models: string[]
  years: number[]
}

async function fetchDistinctMakes(): Promise<{ data: { make: string }[] | null; error: unknown }> {
  const supabase = createServerClient()
  const result = await supabase.from('recalls').select('make')
  return { data: result.data as { make: string }[] | null, error: result.error }
}

async function fetchDistinctModels(): Promise<{ data: { model: string }[] | null; error: unknown }> {
  const supabase = createServerClient()
  const result = await supabase.from('recalls').select('model')
  return { data: result.data as { model: string }[] | null, error: result.error }
}

async function fetchDistinctYears(): Promise<{ data: { model_year: number }[] | null; error: unknown }> {
  const supabase = createServerClient()
  const result = await supabase.from('recalls').select('model_year')
  return { data: result.data as { model_year: number }[] | null, error: result.error }
}

export async function GET(): Promise<NextResponse<FiltersResponse | { error: string }>> {
  try {
    const { data: makeData, error: makeError } = await fetchDistinctMakes()

    if (makeError) {
      return NextResponse.json({ error: 'Failed to fetch filters' }, { status: 500 })
    }

    const { data: modelData, error: modelError } = await fetchDistinctModels()

    if (modelError) {
      return NextResponse.json({ error: 'Failed to fetch filters' }, { status: 500 })
    }

    const { data: yearData, error: yearError } = await fetchDistinctYears()

    if (yearError) {
      return NextResponse.json({ error: 'Failed to fetch filters' }, { status: 500 })
    }

    const makes = [...new Set((makeData ?? []).map((r) => r.make))].sort()
    const models = [...new Set((modelData ?? []).map((r) => r.model))].sort()
    const years = [...new Set((yearData ?? []).map((r) => r.model_year))].sort((a, b) => b - a)

    return NextResponse.json({ makes, models, years })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
