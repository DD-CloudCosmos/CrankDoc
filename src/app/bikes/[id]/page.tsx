import { notFound } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BikeImage } from '@/components/BikeImage'
import { QuickSpecs } from '@/components/QuickSpecs'
import { BikeDetailTabs } from '@/components/BikeDetailTabs'
import { GenerationNavSelector } from '@/components/GenerationNavSelector'
import { SafeDisclaimer } from '@/components/SafeDisclaimer'
import type { Motorcycle, DiagnosticTree, ServiceInterval, MotorcycleImage, TechnicalDocument, Recall } from '@/types/database.types'

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

async function getRecalls(make: string, model: string, yearStart: number, yearEnd: number | null): Promise<Recall[]> {
  const supabase = createServerClient()

  let query = supabase
    .from('recalls')
    .select('*')
    .eq('make', make)
    .eq('model', model)
    .gte('model_year', yearStart)

  if (yearEnd) {
    query = query.lte('model_year', yearEnd)
  }

  const { data, error } = await query.order('report_received_date', { ascending: false })

  if (error) {
    console.error('Error fetching recalls:', error)
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
  const [generations, primaryImage, technicalDocs, trees, serviceIntervals, recalls] = await Promise.all([
    getGenerations(make, model),
    getPrimaryImage(motorcycle.id),
    getTechnicalDocuments(motorcycle.id),
    getDiagnosticTrees(motorcycle.id),
    getServiceIntervals(motorcycle.id),
    getRecalls(make, model, year_start, year_end),
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
      case 'scooter':
        return 'outline'
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
          {/* Recall badge */}
          {(() => {
            // Deduplicate recalls by campaign number for count
            const uniqueCampaigns = new Set(recalls.map((r) => r.nhtsa_campaign_number))
            const recallCount = uniqueCampaigns.size
            if (recallCount === 0) return null
            return (
              <div className="mt-3">
                <Link href={`/recalls?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`}>
                  <Badge variant="destructive" className="cursor-pointer text-sm">
                    <AlertTriangle className="mr-1.5 h-4 w-4" />
                    {recallCount} {recallCount === 1 ? 'Recall' : 'Recalls'}
                  </Badge>
                </Link>
              </div>
            )
          })()}
          {trees.length > 0 && (
            <div className="mt-5">
              <Link href={`/diagnose?bike=${motorcycle.id}`}>
                <Button size="lg" className="w-full md:w-auto">Start Diagnosing</Button>
              </Link>
            </div>
          )}
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

      {/* Quick Specs */}
      <div className="mb-6">
        <QuickSpecs motorcycle={motorcycle} />
      </div>

      {/* Unified tabbed reference section */}
      <section className="mb-8">
        <BikeDetailTabs
          motorcycle={motorcycle}
          documents={technicalDocs}
          serviceIntervals={serviceIntervals}
          recalls={recalls}
        />
      </section>

      {/* Safety Disclaimer */}
      <SafeDisclaimer variant="full" />
    </div>
  )
}
