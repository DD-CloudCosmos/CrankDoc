import { Suspense } from 'react'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { BikeFilters } from '@/components/BikeFilters'
import { BikeTableView } from '@/components/BikeTableView'
import { BikeGridView } from '@/components/BikeGridView'
import { PageContainer, PageHeader } from '@/components/PageHeader'
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

  const availableMakes = await getAvailableMakes().catch(() => ['Honda'])

  return (
    <PageContainer>
      <PageHeader
        title="Bikes"
        subtitle="Specs, service intervals and guides for every model in CrankDoc."
      />

      {(!category || category === 'naked') && (!make || make === 'Honda') && (!search || 'honda cb1000r sc60'.includes(search.toLowerCase())) && (
        <Link href="/bikes/honda-cb1000r-sc60" className="mb-6 block rounded-[20px] bg-card p-5 shadow-card focus-visible:ring-2 focus-visible:ring-ring">
          <p className="text-[13px] text-muted-foreground">NEW · CIRCUIT LEARNING</p>
          <h2 className="mt-1 text-[21px] font-semibold">Honda CB1000R · SC60</h2>
          <p className="mt-2 text-[15px] text-muted-foreground">2008 factory wiring reference and an interactive brake-light lesson.</p>
          <p className="mt-3 text-[15px] text-link">View bike and learn the circuit →</p>
        </Link>
      )}

      {(!category || category === 'naked') && (!make || make === 'Honda') && (!search || 'honda cb650r cb650ra 2023'.includes(search.toLowerCase())) && (
        <Link href="/bikes/honda-cb650ra-2023" className="mb-6 block rounded-[20px] bg-card p-5 shadow-card focus-visible:ring-2 focus-visible:ring-ring">
          <p className="text-[13px] text-muted-foreground">MODEL REFERENCE</p>
          <h2 className="mt-1 text-[21px] font-semibold">Honda CB650RA · 2023</h2>
          <p className="mt-2 text-[15px] text-muted-foreground">European ABS specifications, service schedule and fluids.</p>
          <p className="mt-3 text-[15px] text-link">View bike reference →</p>
        </Link>
      )}

      <Suspense fallback={<div className="mb-6 h-11 animate-pulse rounded-[10px] bg-muted" />}>
        <BikeFilters availableMakes={availableMakes} totalCount={error ? undefined : motorcycles.length} />
      </Suspense>

      {error && (
        <div role="alert" className="mb-6 rounded-[14px] bg-danger-background p-4 text-danger-foreground">
          <p className="font-semibold">Error loading motorcycles</p>
          <p className="text-[15px]">{error}</p>
        </div>
      )}

      {!error && view === 'grid' ? (
        <BikeGridView motorcycles={motorcycles} />
      ) : !error ? (
        <BikeTableView motorcycles={motorcycles} sort={sort} sortDir={sortDir} />
      ) : null}
    </PageContainer>
  )
}
