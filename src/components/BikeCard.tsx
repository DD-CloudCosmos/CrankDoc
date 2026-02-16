import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Motorcycle } from '@/types/database.types'

interface BikeCardProps {
  motorcycle: Motorcycle
}

export function BikeCard({ motorcycle }: BikeCardProps) {
  const {
    id, make, model, year_start, year_end, engine_type,
    displacement_cc, category, generation, horsepower, dry_weight_kg
  } = motorcycle

  // Format year range: "2003-2024" or "2003-present"
  const yearRange = year_end ? `${year_start}-${year_end}` : `${year_start}-present`

  // Format displacement: "599cc" or show "N/A" if not available
  const displacement = displacement_cc ? `${displacement_cc}cc` : 'N/A'

  // Format engine type for display
  const engineDisplay = engine_type || 'N/A'

  // Format category for display (capitalize first letter)
  const categoryDisplay = category
    ? category.charAt(0).toUpperCase() + category.slice(1)
    : 'Other'

  // Generation string already includes years, e.g. "EFI (2007-2022)"
  const generationLabel = generation || null

  // Category color mapping for badges
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

  return (
    <Link href={`/bikes/${id}`} className="block transition-transform duration-200 hover:-translate-y-1">
      <Card className="h-full rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
        <CardHeader>
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
            <CardTitle className="min-w-0 break-words text-xl">{make} {model}</CardTitle>
            <Badge variant={categoryVariant(category)}>{categoryDisplay}</Badge>
          </div>
          <CardDescription className="text-base">{yearRange}</CardDescription>
          {generationLabel && (
            <Badge variant="outline" className="mt-1 w-fit text-xs">
              {generationLabel}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Engine:</span>
              <span className="font-medium text-foreground">{engineDisplay}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Displacement:</span>
              <span className="font-medium text-foreground">{displacement}</span>
            </div>
            {horsepower !== null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Power:</span>
                <span className="font-medium text-foreground">{horsepower} hp</span>
              </div>
            )}
            {dry_weight_kg !== null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Weight:</span>
                <span className="font-medium text-foreground">{dry_weight_kg} kg</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
