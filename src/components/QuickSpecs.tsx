import { Badge } from '@/components/ui/badge'
import type { Motorcycle } from '@/types/database.types'

interface QuickSpecsProps {
  motorcycle: Motorcycle
}

interface SpecBadge {
  label: string
  value: string
}

function buildBadges(motorcycle: Motorcycle): SpecBadge[] {
  const badges: SpecBadge[] = []

  if (motorcycle.displacement_cc !== null) {
    badges.push({ label: 'Displacement', value: `${motorcycle.displacement_cc}cc` })
  }
  if (motorcycle.horsepower !== null) {
    badges.push({ label: 'Power', value: `${motorcycle.horsepower} hp` })
  }
  if (motorcycle.dry_weight_kg !== null) {
    badges.push({ label: 'Weight', value: `${motorcycle.dry_weight_kg} kg` })
  }
  if (motorcycle.oil_capacity_liters !== null) {
    badges.push({ label: 'Oil', value: `${motorcycle.oil_capacity_liters}L` })
  }

  return badges
}

export function QuickSpecs({ motorcycle }: QuickSpecsProps) {
  const badges = buildBadges(motorcycle)

  if (badges.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2" data-testid="quick-specs">
      {badges.map((badge) => (
        <Badge key={badge.label} variant="outline" className="text-sm">
          {badge.value}
        </Badge>
      ))}
    </div>
  )
}
