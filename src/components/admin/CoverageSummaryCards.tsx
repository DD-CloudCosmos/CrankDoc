'use client'

import { Card, CardContent } from '@/components/ui/card'
import type { CoverageSummary } from '@/lib/manuals'

interface CoverageSummaryCardsProps {
  summary: CoverageSummary
}

interface StatCardProps {
  label: string
  value: string
  sublabel?: string
}

function StatCard({ label, value, sublabel }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
        {sublabel && (
          <p className="mt-0.5 text-xs text-muted-foreground">{sublabel}</p>
        )}
      </CardContent>
    </Card>
  )
}

export function CoverageSummaryCards({ summary }: CoverageSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Models Covered"
        value={`${summary.modelsWithManuals} / ${summary.totalModels}`}
        sublabel="models with at least one document"
      />
      <StatCard
        label="Documents Ingested"
        value={String(summary.totalDocumentSources)}
        sublabel="with manual type assigned"
      />
      <StatCard
        label="Local PDFs"
        value={summary.localPdfCount !== null ? String(summary.localPdfCount) : 'N/A'}
        sublabel={summary.localPdfCount !== null ? 'in data/manuals/' : 'not available in production'}
      />
      <StatCard
        label="Coverage Score"
        value={`${summary.overallCoveragePercent}%`}
        sublabel="of matrix cells filled"
      />
    </div>
  )
}
