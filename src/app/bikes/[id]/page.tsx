import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DiagnosticTreeCard } from '@/components/DiagnosticTreeCard'
import { ServiceIntervalTable } from '@/components/ServiceIntervalTable'
import { BikeImage } from '@/components/BikeImage'
import { SpecSheet } from '@/components/SpecSheet'
import { TechnicalDocViewer } from '@/components/TechnicalDocViewer'
import { GenerationNavSelector } from '@/components/GenerationNavSelector'
import { SafeDisclaimer } from '@/components/SafeDisclaimer'
import type { Motorcycle, DiagnosticTree, ServiceInterval, MotorcycleImage, TechnicalDocument } from '@/types/database.types'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getMotorcycle(id: string): Promise<Motorcycle | null> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('motorcycles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching motorcycle:', error)
    return null
  }

  return data
}

async function getGenerations(make: string, model: string): Promise<Motorcycle[]> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('motorcycles')
    .select('*')
    .eq('make', make)
    .eq('model', model)
    .order('year_start', { ascending: true })

  if (error) {
    console.error('Error fetching generations:', error)
    return []
  }

  return data ?? []
}

async function getPrimaryImage(motorcycleId: string): Promise<MotorcycleImage | null> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('motorcycle_images')
    .select('*')
    .eq('motorcycle_id', motorcycleId)
    .eq('is_primary', true)
    .single()

  if (error) {
    // Not an error if no image found — just return null
    if (error.code !== 'PGRST116') {
      console.error('Error fetching primary image:', error)
    }
    return null
  }

  return data
}

async function getTechnicalDocuments(motorcycleId: string): Promise<TechnicalDocument[]> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('technical_documents')
    .select('*')
    .eq('motorcycle_id', motorcycleId)
    .order('doc_type')

  if (error) {
    console.error('Error fetching technical documents:', error)
    return []
  }

  return data ?? []
}

async function getDiagnosticTrees(motorcycleId: string): Promise<DiagnosticTree[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('diagnostic_trees')
    .select('*')
    .eq('motorcycle_id', motorcycleId)
    .order('title')

  if (error) {
    console.error('Error fetching diagnostic trees:', error)
    return []
  }
  return data ?? []
}

async function getServiceIntervals(motorcycleId: string): Promise<ServiceInterval[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('service_intervals')
    .select('*')
    .eq('motorcycle_id', motorcycleId)
    .order('interval_miles', { ascending: true, nullsFirst: false })

  if (error) {
    console.error('Error fetching service intervals:', error)
    return []
  }
  return data ?? []
}

export default async function BikeDetailPage({ params }: PageProps) {
  const { id } = await params
  const motorcycle = await getMotorcycle(id)

  if (!motorcycle) {
    notFound()
  }

  const { make, model, year_start, year_end, category, generation } = motorcycle

  // Fetch all data in parallel
  const [generations, primaryImage, technicalDocs, trees, serviceIntervals] = await Promise.all([
    getGenerations(make, model),
    getPrimaryImage(motorcycle.id),
    getTechnicalDocuments(motorcycle.id),
    getDiagnosticTrees(motorcycle.id),
    getServiceIntervals(motorcycle.id),
  ])

  // Format year range
  const yearRange = year_end ? `${year_start}-${year_end}` : `${year_start}-present`

  // Format category
  const categoryDisplay = category
    ? category.charAt(0).toUpperCase() + category.slice(1)
    : 'Other'

  // Category color mapping
  const categoryVariant = (cat: string | null) => {
    switch (cat) {
      case 'sport':
        return 'default'
      case 'naked':
        return 'secondary'
      case 'cruiser':
        return 'outline'
      case 'adventure':
        return 'secondary'
      default:
        return 'default'
    }
  }

  // Prepare generation items for the selector
  const generationItems = generations.map((gen) => ({
    id: gen.id,
    generation: gen.generation,
    year_start: gen.year_start,
    year_end: gen.year_end,
  }))

  const hasMultipleGenerations = generations.length > 1

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Link href="/bikes">
          <Button variant="ghost" size="sm" className="mb-4">
            ← Back to all bikes
          </Button>
        </Link>
      </div>

      {/* Hero section */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <BikeImage
          image={primaryImage}
          make={make}
          model={model}
          className="w-full"
        />
        <div className="flex flex-col justify-center">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">
            {make} {model}
          </h1>
          <p className="text-xl text-muted-foreground">{yearRange}</p>
          {generation && (
            <p className="mt-1 text-base text-muted-foreground">{generation}</p>
          )}
          <div className="mt-3">
            <Badge variant={categoryVariant(category)} className="text-base">
              {categoryDisplay}
            </Badge>
          </div>
        </div>
      </div>

      {/* Generation selector */}
      {hasMultipleGenerations && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Generations</h2>
          <GenerationNavSelector
            generations={generationItems}
            activeGenerationId={motorcycle.id}
          />
        </div>
      )}

      {/* Full Specifications */}
      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-bold tracking-tight">Specifications</h2>
        <SpecSheet motorcycle={motorcycle} />
      </section>

      {/* Service Intervals */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Service Intervals</CardTitle>
          <CardDescription>Recommended maintenance schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceIntervalTable intervals={serviceIntervals} />
        </CardContent>
      </Card>

      {/* Diagnostic Trees */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Diagnostic Trees</CardTitle>
          <CardDescription>Available troubleshooting guides</CardDescription>
        </CardHeader>
        <CardContent>
          {trees.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">
                No diagnostic trees available yet for this model.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Check back soon as we add more diagnostic guides.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {trees.map((tree) => (
                <DiagnosticTreeCard key={tree.id} tree={tree} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Technical Documents */}
      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-bold tracking-tight">Technical Documents</h2>
        <TechnicalDocViewer
          documents={technicalDocs}
          serviceIntervals={serviceIntervals}
          motorcycle={motorcycle}
        />
      </section>

      {/* Safety Disclaimer */}
      <SafeDisclaimer variant="full" />
    </div>
  )
}
