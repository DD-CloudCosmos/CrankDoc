import Link from 'next/link'
import { Zap, Cog, Fuel, Thermometer, CircleStop, ArrowUpDown, Wind, Power, Settings, Wrench } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GroupedList, ListRow, IconTile } from '@/components/ui/grouped-list'
import { DIFFICULTY_STYLES } from '@/lib/badgeStyles'
import { TreeSkillFlag } from '@/components/SkillNotice'
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


// iOS Settings-style coloured tiles per category (decorative; the label carries meaning)
const CATEGORY_TILE: Record<string, string> = {
  electrical: 'bg-[#FF9500]',
  engine: 'bg-[#8E8E93]',
  fuel: 'bg-[#34C759]',
  cooling: 'bg-[#0A84FF]',
  brakes: 'bg-[#FF3B30]',
  suspension: 'bg-[#5856D6]',
  exhaust: 'bg-[#636366]',
  starting: 'bg-[#FFCC00]',
  transmission: 'bg-[#AF52DE]',
  general: 'bg-[#8E8E93]',
}

export function DiagnoseSymptomList({ motorcycle, trees }: DiagnoseSymptomListProps) {
  const grouped = groupTreesByCategory(trees)

  return (
    <div className="space-y-6" style={{ animation: 'riseIn 0.4s ease-out both' }}>
      {/* Bike context */}
      <div className="flex items-center justify-between gap-4 rounded-[20px] bg-card p-4 shadow-card">
        <div className="min-w-0">
          {motorcycle ? (
            <>
              <p className="text-[17px] font-semibold">{motorcycle.make} {motorcycle.model}</p>
              <p className="text-[15px] text-muted-foreground">
                {motorcycle.generation || `${motorcycle.year_start}${motorcycle.year_end ? `-${motorcycle.year_end}` : '-present'}`}
                {motorcycle.category && ` · ${capitalize(motorcycle.category)}`}
              </p>
            </>
          ) : (
            <>
              <p className="text-[17px] font-semibold">General Guides</p>
              <p className="text-[15px] text-muted-foreground">Universal troubleshooting for all motorcycles</p>
            </>
          )}
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/diagnose">Change</Link>
        </Button>
      </div>

      <div>
        <h2 className="mb-4 text-[22px] font-semibold tracking-[-0.02em]">What&apos;s the problem?</h2>

        {trees.length === 0 ? (
          <div className="rounded-[20px] bg-card px-6 py-10 text-center shadow-card">
            <p className="text-muted-foreground">No diagnostic guides found for this motorcycle</p>
            <Link href="/diagnose" className="mt-2 inline-block text-[15px] text-link hover:underline">&larr; Back to bike selection</Link>
          </div>
        ) : (
          <div className="space-y-7">
            {Object.entries(grouped).map(([category, categoryTrees]) => {
              const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.general
              const Icon = config.icon
              return (
                <GroupedList key={category} header={config.label}>
                  {categoryTrees.map((tree) => (
                    <ListRow
                      key={tree.id}
                      href={`/diagnose/${tree.id}`}
                      leading={
                        <IconTile className={CATEGORY_TILE[category] ?? CATEGORY_TILE.general}>
                          <Icon />
                        </IconTile>
                      }
                      label={<span className="font-medium">{tree.title}</span>}
                      subtitle={
                        <span className="flex flex-col gap-1.5 pt-0.5">
                          {tree.description && <span className="line-clamp-1">{tree.description}</span>}
                          <span className="flex flex-wrap items-center gap-2">
                            {tree.difficulty && DIFFICULTY_STYLES[tree.difficulty] && (
                              <Badge variant="outline" className={DIFFICULTY_STYLES[tree.difficulty].badgeClass}>
                                {DIFFICULTY_STYLES[tree.difficulty].label}
                              </Badge>
                            )}
                            <TreeSkillFlag difficulty={tree.difficulty} />
                          </span>
                        </span>
                      }
                    />
                  ))}
                </GroupedList>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
