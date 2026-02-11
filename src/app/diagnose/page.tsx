import { createServerClient } from '@/lib/supabase/server'
import { DiagnosticTreeCard } from '@/components/DiagnosticTreeCard'
import type { DiagnosticTree } from '@/types/database.types'

async function getDiagnosticTrees(): Promise<{ data: DiagnosticTree[] | null; error: string | null }> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('diagnostic_trees')
    .select('*')
    .order('title')

  if (error) {
    console.error('Error fetching diagnostic trees:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export default async function DiagnosePage() {
  const { data: trees, error } = await getDiagnosticTrees()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold">Diagnostic Trees</h1>
        <p className="text-muted-foreground">
          Step-by-step troubleshooting for common motorcycle issues
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-8 text-center">
          <p className="text-red-400">Error loading diagnostic trees</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Failed to fetch diagnostic trees from database. Please try again later.
          </p>
        </div>
      )}

      {!error && trees && trees.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-lg text-muted-foreground">
            No diagnostic trees available yet
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Check back soon as we add troubleshooting guides.
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
