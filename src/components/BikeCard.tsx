import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Motorcycle } from '@/types/database.types'

interface BikeCardProps {
  motorcycle: Motorcycle
}

export function BikeCard({ motorcycle }: BikeCardProps) {
  const { id, make, model, year_start, year_end, engine_type, displacement_cc, category } = motorcycle

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

  // Category color mapping for badges
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
    <Link href={`/bikes/${id}`} className="block transition-transform hover:scale-105">
      <Card className="h-full">
        <CardHeader>
          <div className="mb-2 flex items-start justify-between">
            <CardTitle className="text-xl">{make} {model}</CardTitle>
            <Badge variant={categoryVariant(category)}>{categoryDisplay}</Badge>
          </div>
          <CardDescription className="text-base">{yearRange}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Engine:</span>
              <span className="font-medium text-zinc-100">{engineDisplay}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Displacement:</span>
              <span className="font-medium text-zinc-100">{displacement}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
