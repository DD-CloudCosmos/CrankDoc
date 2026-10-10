import type { Metadata } from 'next'
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
import { BackButton } from '@/components/BackButton'
import type { Motorcycle, DiagnosticTree, ServiceInterval, MotorcycleImage, TechnicalDocument, Recall } from '@/types/database.types'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = createServerClient()
  const { data: motorcycle } = await supabase
    .from('motorcycles')
    .select('make, model, year_start, year_end, category')
    .eq('id', id)
    .single()

  if (!motorcycle) {
    return { title: 'Bike Not Found | CrankDoc' }
  }

  const title = `${motorcycle.make} ${motorcycle.model} Specs | CrankDoc`
  const description = `Detailed specs, diagnostic trees, service intervals, and recalls for the ${motorcycle.make} ${motorcycle.model} (${motorcycle.year_start}-${motorcycle.year_end || 'present'}).`

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
  return (data ?? []) as DiagnosticTree[]
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
    .ilike('make', make)
    .ilike('model', model)
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

function getSettledValue<T>(result: PromiseSettledResult<T>, fallback: T): T {
  if (result.status === 'fulfilled') {
    return result.value
  }
  console.error('Query failed, using fallback:', result.reason)
  return fallback
}

export default async function BikeDetailPage({ params }: PageProps) {
  const { id } = await params
  const motorcycle = await getMotorcycle(id)

  if (!motorcycle) {
    notFound()
  }

  const { make, model, year_start, year_end, category, generation } = motorcycle

  // Fetch all data in parallel — use allSettled so one failure doesn't break the page
  const results = await Promise.allSettled([
    getGenerations(make, model),
    getPrimaryImage(motorcycle.id),
    getTechnicalDocuments(motorcycle.id),
    getDiagnosticTrees(motorcycle.id),
    getServiceIntervals(motorcycle.id),
    getRecalls(make, model, year_start, year_end),
  ])

  const generations = getSettledValue(results[0], [] as Motorcycle[])
  const primaryImage = getSettledValue(results[1], null as MotorcycleImage | null)
  const technicalDocs = getSettledValue(results[2], [] as TechnicalDocument[])
  const trees = getSettledValue(results[3], [] as DiagnosticTree[])
  const serviceIntervals = getSettledValue(results[4], [] as ServiceInterval[])
  const recalls = getSettledValue(results[5], [] as Recall[])

  // Format year range
  const yearRange = year_end ? `${year_start}-${year_end}` : `${year_start}-present`

  // Format category
  const categoryDisplay = category
    ? category.charAt(0).toUpperCase() + category.slice(1)
    : 'Other'

  // Category color mapping
  const categoryVariant = (cat: string | null) => {
    switch (cat) {
      case 'cruiser':
      case 'scooter':
        return 'outline'
      default:
        return 'secondary'
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

  // Deduplicate recalls by campaign number for the count
  const recallCount = new Set(recalls.map((r) => r.nhtsa_campaign_number)).size

  return (
    <div className="mx-auto w-full max-w-[1024px] px-4 py-6 md:px-[22px] md:py-10">
      <BackButton href="/bikes" label="Bikes" ariaLabel="Back to all bikes" />

      {/* Hero */}
      <div className="mb-8 mt-2 grid grid-cols-1 items-center gap-6 md:grid-cols-2 md:gap-10">
        <BikeImage image={primaryImage} make={make} model={model} className="w-full" />
        <div>
          <p className="text-[17px] text-muted-foreground">{make}</p>
          <h1 className="text-[40px] font-bold leading-tight tracking-[-0.03em] md:text-[48px]">{model}</h1>
          <p className="mt-1 text-[17px] text-muted-foreground">
            {yearRange}
            {generation && ` · ${generation}`}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant={categoryVariant(category)} className="text-[13px]">
              {categoryDisplay}
            </Badge>
            {recallCount > 0 && (
              <Link
                href={`/recalls?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`}
                className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full bg-danger-background px-3 text-[13px] font-semibold text-danger-foreground hover:opacity-90"
              >
                <AlertTriangle aria-hidden="true" className="h-4 w-4" />
                {recallCount} {recallCount === 1 ? 'Recall' : 'Recalls'}
              </Link>
            )}
          </div>
          {trees.length > 0 && (
            <Button asChild className="mt-6 w-full md:w-auto">
              <Link href={`/diagnose?bike=${motorcycle.id}`}>Start Diagnosing</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Generation selector */}
      {hasMultipleGenerations && (
        <div className="mb-8">
          <h2 className="mb-3 text-[22px] font-semibold tracking-[-0.02em]">Generations</h2>
          <GenerationNavSelector
            generations={generationItems}
            activeGenerationId={motorcycle.id}
          />
        </div>
      )}

      {/* Quick Specs */}
      <div className="mb-8">
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
