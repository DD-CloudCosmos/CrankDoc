import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { DiagnosticTreeCard } from '@/components/DiagnosticTreeCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { DiagnosticTree, Motorcycle } from '@/types/database.types'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function getDiagnosticTrees(bikeId?: string): Promise<{ data: DiagnosticTree[] | null; error: string | null }> {
  const supabase = createServerClient()

  let query = supabase
    .from('diagnostic_trees')
    .select('*')

  if (bikeId) {
    query = query.or(`motorcycle_id.eq.${bikeId},motorcycle_id.is.null`)
  }

  const { data, error } = await query.order('title')

  if (error) {
    console.error('Error fetching diagnostic trees:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
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

export default async function DiagnosePage({ searchParams }: PageProps) {
  const params = await searchParams
  const bikeId = typeof params.bike === 'string' ? params.bike : undefined

  const [{ data: trees, error }, motorcycle] = await Promise.all([
    getDiagnosticTrees(bikeId),
    bikeId ? getMotorcycle(bikeId) : Promise.resolve(null),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Diagnostic Trees</h1>
        <p className="text-muted-foreground">
          Step-by-step troubleshooting for common motorcycle issues
        </p>

        {motorcycle && (
          <div className="mt-3 flex items-center gap-3">
            <Badge variant="secondary">
              {motorcycle.make} {motorcycle.model}
            </Badge>
            <Link href="/diagnose">
              <Button variant="ghost" size="sm">View all guides</Button>
            </Link>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-700">Error loading diagnostic trees</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Failed to fetch diagnostic trees from database. Please try again later.
          </p>
        </div>
      )}

      {!error && trees && trees.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-lg text-muted-foreground">
            {motorcycle
              ? 'No diagnostic trees available for this motorcycle yet'
              : 'No diagnostic trees available yet'}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {motorcycle ? (
              <Link href="/diagnose" className="underline hover:text-foreground">
                View all diagnostic guides
              </Link>
            ) : (
              'Check back soon as we add troubleshooting guides.'
            )}
          </p>
        </div>
      )}

      {!error && trees && trees.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trees.map((tree) => (
            <DiagnosticTreeCard key={tree.id} tree={tree} />
          ))}
        </div>
      )}
    </div>
  )
}
