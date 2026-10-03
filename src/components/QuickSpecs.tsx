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
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="quick-specs">
      {badges.map((badge) => (
        <div key={badge.label} className="flex flex-col-reverse rounded-[16px] bg-card p-4 shadow-card">
          <dt className="mt-0.5 text-[13px] text-muted-foreground">{badge.label}</dt>
          <dd className="text-[24px] font-semibold tracking-[-0.02em]">{badge.value}</dd>
        </div>
      ))}
    </dl>
  )
}
