import Link from 'next/link'
import { ChevronRight, Zap, Cog, Fuel, Thermometer, CircleStop, ArrowUpDown, Wind, Power, Settings, Wrench } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DIFFICULTY_STYLES } from '@/lib/badgeStyles'
import type { Motorcycle, DiagnosticTree } from '@/types/database.types'
import type { LucideIcon } from 'lucide-react'

const CATEGORY_CONFIG: Record<string, { icon: LucideIcon; label: string }> = {
  electrical: { icon: Zap, label: 'Electrical' },
  engine: { icon: Cog, label: 'Engine' },
  fuel: { icon: Fuel, label: 'Fuel System' },
  cooling: { icon: Thermometer, label: 'Cooling' },
  brakes: { icon: CircleStop, label: 'Brakes' },
  suspension: { icon: ArrowUpDown, label: 'Suspension' },
  exhaust: { icon: Wind, label: 'Exhaust' },
  starting: { icon: Power, label: 'Starting' },
  transmission: { icon: Settings, label: 'Transmission' },
  general: { icon: Wrench, label: 'General' },
}

interface DiagnoseSymptomListProps {
  motorcycle: Motorcycle | null
  trees: DiagnosticTree[]
  bikeId: string
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function groupTreesByCategory(trees: DiagnosticTree[]): Record<string, DiagnosticTree[]> {
  const grouped: Record<string, DiagnosticTree[]> = {}
  for (const tree of trees) {
    const category = tree.category || 'general'
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(tree)
  }
  return grouped
}


export function DiagnoseSymptomList({ motorcycle, trees }: DiagnoseSymptomListProps) {
  const grouped = groupTreesByCategory(trees)

  return (
    <div className="space-y-4" style={{ animation: 'riseIn 0.6s ease-out both' }}>
      {/* Bike context bar */}
      <div className="rounded-[24px] bg-secondary p-4 flex items-center justify-between">
        <div>
          {motorcycle ? (
            <>
              <p className="font-semibold">{motorcycle.make} {motorcycle.model}</p>
              <p className="text-sm text-muted-foreground">
                {motorcycle.generation || `${motorcycle.year_start}${motorcycle.year_end ? `-${motorcycle.year_end}` : '-present'}`}
                {motorcycle.category && ` · ${capitalize(motorcycle.category)}`}
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold">General Guides</p>
              <p className="text-sm text-muted-foreground">Universal troubleshooting for all motorcycles</p>
            </>
          )}
        </div>
        <Link href="/diagnose">
          <Button variant="ghost" size="sm">Change</Button>
        </Link>
      </div>

      {/* Main content card with grouped trees */}
      <div className="bg-card rounded-[24px] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
        <h2 className="text-xl font-bold mb-4">What&apos;s the problem?</h2>

        {trees.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No diagnostic guides found for this motorcycle</p>
            <Link href="/diagnose" className="text-sm hover:underline mt-2 inline-block">&larr; Back to bike selection</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([category, categoryTrees]) => {
              const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.general
              const Icon = config.icon
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{config.label}</h3>
                  </div>
                  <div className="space-y-2">
                    {categoryTrees.map((tree) => (
                      <Link href={`/diagnose/${tree.id}`} key={tree.id}>
                        <div className="rounded-[16px] border border-border bg-card px-4 py-3 flex items-center justify-between hover:bg-accent transition-colors">
                          <div>
                            <span className="font-semibold">{tree.title}</span>
                            {tree.description && <p className="text-sm text-muted-foreground line-clamp-2">{tree.description}</p>}
                            {tree.difficulty && DIFFICULTY_STYLES[tree.difficulty] && (
                              <Badge variant="outline" className={DIFFICULTY_STYLES[tree.difficulty].badgeClass}>
                                {DIFFICULTY_STYLES[tree.difficulty].label}
                              </Badge>
                            )}
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
