import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { TreeWalker } from '@/components/TreeWalker'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { DecisionTreeData } from '@/types/database.types'

interface PageProps {
  params: Promise<{ treeId: string }>
}

export default async function DiagnoseTreePage({ params }: PageProps) {
  const { treeId } = await params
  const supabase = createServerClient()

  const { data: tree, error } = await supabase
    .from('diagnostic_trees')
    .select('*')
    .eq('id', treeId)
    .single()

  if (error || !tree) {
    notFound()
  }

  // Fetch motorcycle name if tree is linked to one
  let motorcycleName: string | null = null
  if (tree.motorcycle_id) {
    const { data: motorcycle } = await supabase
      .from('motorcycles')
      .select('make, model')
      .eq('id', tree.motorcycle_id)
      .single()

    if (motorcycle) {
      motorcycleName = `${motorcycle.make} ${motorcycle.model}`
    }
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
