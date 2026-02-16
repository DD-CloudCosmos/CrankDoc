import { Suspense } from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { BikeFilters } from '@/components/BikeFilters'
import { BikeTableView } from '@/components/BikeTableView'
import { BikeGridView } from '@/components/BikeGridView'
import type { Motorcycle, MotorcycleImage } from '@/types/database.types'

export type MotorcycleWithImage = Motorcycle & {
  primaryImage?: Pick<MotorcycleImage, 'image_url' | 'alt_text'> | null
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function getPrimaryImages(
  motorcycleIds: string[]
): Promise<Map<string, Pick<MotorcycleImage, 'image_url' | 'alt_text'>>> {
  const imageMap = new Map<string, Pick<MotorcycleImage, 'image_url' | 'alt_text'>>()
  if (motorcycleIds.length === 0) return imageMap

  const supabase = createServerClient()
  const result = await supabase
    .from('motorcycle_images')
    .select('*')
    .in('motorcycle_id', motorcycleIds)
    .eq('is_primary', true)

  const images = result.data as MotorcycleImage[] | null
  if (images) {
    for (const img of images) {
      imageMap.set(img.motorcycle_id, {
        image_url: img.image_url,
        alt_text: img.alt_text,
      })
    }
  }

  return imageMap
}

async function getMotorcycles(
  category?: string,
  make?: string,
  search?: string,
  sort?: string,
  sortDir?: 'asc' | 'desc'
): Promise<MotorcycleWithImage[]> {
  const supabase = createServerClient()

  // Determine sort column — only allow known columns
  const validSortColumns = ['make', 'year_start', 'displacement_cc', 'horsepower', 'dry_weight_kg']
  const sortColumn = sort && validSortColumns.includes(sort) ? sort : 'make'
  const ascending = sortDir === 'desc' ? false : true

  let query = supabase
    .from('motorcycles')
    .select('*')
    .order(sortColumn, { ascending })

  // Secondary sort by model when sorting by make
  if (sortColumn === 'make') {
    query = query.order('model', { ascending: true })
  }

  if (category) {
    query = query.eq('category', category)
  }

  if (make) {
    query = query.eq('make', make)
  }

  if (search) {
    query = query.or(`make.ilike.%${search}%,model.ilike.%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching motorcycles:', error)
    throw new Error('Failed to fetch motorcycles from database')
  }

  const motorcycles: Motorcycle[] = data || []

  if (motorcycles.length === 0) {
    return []
  }

  // Fetch primary images for all motorcycles
  const imageMap = await getPrimaryImages(motorcycles.map((m) => m.id))

  return motorcycles.map((moto) => ({
    ...moto,
    primaryImage: imageMap.get(moto.id) ?? null,
  }))
}

async function getAvailableMakes(): Promise<string[]> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('motorcycles')
    .select('make')
    .order('make', { ascending: true })

  if (error) {
    console.error('Error fetching makes:', error)
    return []
  }

  if (!data) {
    return []
  }

  const uniqueMakes = Array.from(new Set(data.map((item: { make: string }) => item.make)))
  return uniqueMakes
}

export default async function BikesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const category = typeof params.category === 'string' ? params.category : undefined
  const make = typeof params.make === 'string' ? params.make : undefined
  const search = typeof params.search === 'string' ? params.search : undefined
  const sort = typeof params.sort === 'string' ? params.sort : 'make'
  const sortDir = params.sortDir === 'desc' ? 'desc' as const : 'asc' as const
  const view = typeof params.view === 'string' ? params.view : 'table'

  let motorcycles: MotorcycleWithImage[] = []
  let error: string | null = null

  try {
    motorcycles = await getMotorcycles(category, make, search, sort, sortDir)
  } catch (err) {
    error = err instanceof Error ? err.message : 'An unexpected error occurred'
  }

  const availableMakes = await getAvailableMakes()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Motorcycle Database</h1>
        <p className="text-muted-foreground">
          Browse specifications and technical data for various motorcycle models
        </p>
      </div>

      <Suspense fallback={<div>Loading filters...</div>}>
        <BikeFilters availableMakes={availableMakes} totalCount={error ? undefined : motorcycles.length} />
      </Suspense>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Error loading motorcycles</p>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!error && view === 'grid' ? (
        <BikeGridView motorcycles={motorcycles} />
      ) : !error ? (
        <BikeTableView motorcycles={motorcycles} sort={sort} sortDir={sortDir} />
      ) : null}
    </div>
  )
}
