import { createServerClient } from '@/lib/supabase/server'
import { DiagnoseStepIndicator } from '@/components/DiagnoseStepIndicator'
import { DiagnoseBikeSelector } from '@/components/DiagnoseBikeSelector'
import { DiagnoseSymptomList } from '@/components/DiagnoseSymptomList'
import type { Motorcycle, DiagnosticTree } from '@/types/database.types'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function getAllMotorcycles(): Promise<Motorcycle[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('motorcycles')
    .select('*')
    .order('make')

  if (error) {
    console.error('Error fetching motorcycles:', error)
    return []
  }

  return data ?? []
}

async function getTreeCounts(): Promise<Record<string, number>> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('diagnostic_trees')
    .select('id, motorcycle_id')

  if (error) {
    console.error('Error fetching tree counts:', error)
    return {}
  }

  const counts: Record<string, number> = {}
  for (const tree of data ?? []) {
    if (tree.motorcycle_id) {
      counts[tree.motorcycle_id] = (counts[tree.motorcycle_id] || 0) + 1
    }
  }
  return counts
}

async function getMotorcycle(id: string): Promise<Motorcycle | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('motorcycles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return null
  }

  return data
}

async function getTreesForBike(bikeId: string): Promise<DiagnosticTree[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('diagnostic_trees')
    .select('*')
    .eq('motorcycle_id', bikeId)
    .order('category')
    .order('title')

  if (error) {
    console.error('Error fetching trees for bike:', error)
    return []
  }

  return data ?? []
}

async function getUniversalTrees(): Promise<DiagnosticTree[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('diagnostic_trees')
    .select('*')
    .is('motorcycle_id', null)
    .order('category')
    .order('title')

  if (error) {
    console.error('Error fetching universal trees:', error)
    return []
  }

  return data ?? []
}

export default async function DiagnosePage({ searchParams }: PageProps) {
  const params = await searchParams
  const bikeId = typeof params.bike === 'string' ? params.bike : undefined

  // Step 2: Bike selected (specific or general)
  if (bikeId) {
    const isGeneral = bikeId === 'general'
    const [motorcycle, trees] = await Promise.all([
      isGeneral ? Promise.resolve(null) : getMotorcycle(bikeId),
      isGeneral ? getUniversalTrees() : getTreesForBike(bikeId),
    ])

    return (
      <div className="container mx-auto px-4 py-8">
        <DiagnoseStepIndicator currentStep={2} bikeId={bikeId} />
        <DiagnoseSymptomList motorcycle={motorcycle} trees={trees} bikeId={bikeId} />
      </div>
    )
  }

  // Step 1: Select your motorcycle
  const [motorcycles, treeCounts] = await Promise.all([
    getAllMotorcycles(),
    getTreeCounts(),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <DiagnoseStepIndicator currentStep={1} />
      <DiagnoseBikeSelector motorcycles={motorcycles} treeCounts={treeCounts} />
    </div>
  )
}
