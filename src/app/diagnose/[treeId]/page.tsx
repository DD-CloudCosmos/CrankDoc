import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { TreeWalker } from '@/components/TreeWalker'
import { DiagnoseStepIndicator } from '@/components/DiagnoseStepIndicator'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Motorcycle, DiagnosticTree, DecisionTreeData } from '@/types/database.types'

interface PageProps {
  params: Promise<{ treeId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { treeId } = await params
  const supabase = createServerClient()
  const { data: tree } = await supabase
    .from('diagnostic_trees')
    .select('title, motorcycle_id')
    .eq('id', treeId)
    .single()

  if (!tree) {
    return { title: 'Diagnostic Tree | CrankDoc' }
  }

  let bikeName = 'Universal'
  if (tree.motorcycle_id) {
    const { data: motorcycle } = await supabase
      .from('motorcycles')
      .select('make, model')
      .eq('id', tree.motorcycle_id)
      .single()
    if (motorcycle) {
      bikeName = `${motorcycle.make} ${motorcycle.model}`
    }
  }

  const title = `${tree.title} — ${bikeName} | CrankDoc`
  const description = `Step-by-step diagnostic guide: ${tree.title} for ${bikeName}. Follow guided troubleshooting to find and fix the issue.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
    },
  }
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

  const backHref = tree.motorcycle_id
    ? `/diagnose?bike=${tree.motorcycle_id}`
    : '/diagnose'

  return (
    <div className="container mx-auto px-4 py-8">
      <DiagnoseStepIndicator currentStep={3} bikeId={tree.motorcycle_id || undefined} />
      <div className="mb-6">
        <Link href={backHref}>
          <Button variant="ghost" size="sm" className="mb-4">
            &larr; Back to symptoms
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
