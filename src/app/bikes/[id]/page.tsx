import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Motorcycle } from '@/types/database.types'

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

export default async function BikeDetailPage({ params }: PageProps) {
  const { id } = await params
  const motorcycle = await getMotorcycle(id)

  if (!motorcycle) {
    notFound()
  }

  const { make, model, year_start, year_end, engine_type, displacement_cc, category } = motorcycle

  // Format year range
  const yearRange = year_end ? `${year_start}-${year_end}` : `${year_start}-present`

  // Format displacement
  const displacement = displacement_cc ? `${displacement_cc}cc` : 'Not specified'

  // Format engine type
  const engineDisplay = engine_type || 'Not specified'

  // Format category
  const categoryDisplay = category
    ? category.charAt(0).toUpperCase() + category.slice(1)
    : 'Other'

  // Category color mapping
  const categoryVariant = (cat: string | null) => {
    switch (cat) {
      case 'sport':
        return 'destructive'
      case 'naked':
        return 'secondary'
      case 'cruiser':
        return 'default'
      case 'adventure':
        return 'outline'
      default:
        return 'default'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/bikes">
          <Button variant="ghost" size="sm" className="mb-4">
            ← Back to all bikes
          </Button>
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">
              {make} {model}
            </h1>
            <p className="text-xl text-muted-foreground">{yearRange}</p>
          </div>
          <Badge variant={categoryVariant(category)} className="self-start text-base">
            {categoryDisplay}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
            <CardDescription>Technical details and specifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span className="text-zinc-400">Make</span>
              <span className="font-medium">{make}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span className="text-zinc-400">Model</span>
              <span className="font-medium">{model}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span className="text-zinc-400">Years</span>
              <span className="font-medium">{yearRange}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span className="text-zinc-400">Engine Type</span>
              <span className="font-medium">{engineDisplay}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span className="text-zinc-400">Displacement</span>
              <span className="font-medium">{displacement}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Category</span>
              <span className="font-medium">{categoryDisplay}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Diagnostic Trees</CardTitle>
            <CardDescription>Available troubleshooting guides</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8 text-center">
              <p className="text-muted-foreground">
                No diagnostic trees available yet for this model.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Check back soon as we add more diagnostic guides.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
