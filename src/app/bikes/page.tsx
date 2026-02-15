import { Suspense } from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { BikeCard } from '@/components/BikeCard'
import { BikeFilters } from '@/components/BikeFilters'
import type { Motorcycle } from '@/types/database.types'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function getMotorcycles(category?: string, make?: string): Promise<Motorcycle[]> {
  const supabase = createServerClient()

  let query = supabase
    .from('motorcycles')
    .select('*')
    .order('make', { ascending: true })
    .order('model', { ascending: true })

  // Apply category filter if provided
  if (category) {
    query = query.eq('category', category)
  }

  // Apply make filter if provided
  if (make) {
    query = query.eq('make', make)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching motorcycles:', error)
    throw new Error('Failed to fetch motorcycles from database')
  }

  return data || []
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

  // Get unique makes - data is an array of objects with 'make' property
  const uniqueMakes = Array.from(new Set(data.map((item: { make: string }) => item.make)))
  return uniqueMakes
}

export default async function BikesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const category = typeof params.category === 'string' ? params.category : undefined
  const make = typeof params.make === 'string' ? params.make : undefined

  let motorcycles: Motorcycle[] = []
  let error: string | null = null

  try {
    motorcycles = await getMotorcycles(category, make)
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
        <BikeFilters availableMakes={availableMakes} />
      </Suspense>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Error loading motorcycles</p>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!error && motorcycles.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-lg text-muted-foreground">
            No motorcycles found matching your filters.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try adjusting your filter criteria or clearing all filters.
          </p>
        </div>
      )}

      {!error && motorcycles.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {motorcycles.map((motorcycle) => (
            <BikeCard key={motorcycle.id} motorcycle={motorcycle} />
          ))}
        </div>
      )}
    </div>
  )
}
