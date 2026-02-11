import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { TreeWalker } from '@/components/TreeWalker'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Motorcycle, DiagnosticTree, DecisionTreeData } from '@/types/database.types'

interface PageProps {
  params: Promise<{ treeId: string }>
}

async function getTree(treeId: string): Promise<DiagnosticTree | null> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('diagnostic_trees')
    .select('*')
    .eq('id', treeId)
    .single()

  if (error) {
    console.error('Error fetching diagnostic tree:', error)
    return null
  }

  return data
}

async function getMotorcycleName(motorcycleId: string): Promise<string | null> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('motorcycles')
    .select('*')
    .eq('id', motorcycleId)
    .single()

  if (error) {
    console.error('Error fetching motorcycle:', error)
    return null
  }

  const motorcycle = data as Motorcycle
  return `${motorcycle.make} ${motorcycle.model}`
}

export default async function DiagnoseTreePage({ params }: PageProps) {
  const { treeId } = await params
  const tree = await getTree(treeId)

  if (!tree) {
    notFound()
  }

  // Fetch motorcycle name if tree is linked to one
  let motorcycleName: string | null = null
  if (tree.motorcycle_id) {
    motorcycleName = await getMotorcycleName(tree.motorcycle_id)
  }

  const treeData = tree.tree_data as unknown as DecisionTreeData

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/diagnose">
          <Button variant="ghost" size="sm" className="mb-4">
            &larr; Back to all diagnostics
          </Button>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {motorcycleName && (
            <span className="text-sm text-muted-foreground">{motorcycleName}</span>
          )}
          {tree.difficulty && (
            <Badge variant="outline">{tree.difficulty}</Badge>
          )}
          {tree.category && (
            <Badge variant="outline">{tree.category}</Badge>
          )}
        </div>
        {tree.description && (
          <p className="mt-2 text-muted-foreground">{tree.description}</p>
        )}
      </div>

      <TreeWalker treeData={treeData} treeTitle={tree.title} />
    </div>
  )
}
