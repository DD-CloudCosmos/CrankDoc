import { buildCoverageMatrix } from '@/lib/manuals'
import { fetchMotorcycles, fetchDocumentSources, scanLocalManuals } from '@/lib/manuals.server'
import { CoverageSummaryCards } from '@/components/admin/CoverageSummaryCards'
import { ManualCoverageMatrix } from '@/components/admin/ManualCoverageMatrix'

export const dynamic = 'force-dynamic'

export default async function AdminManualsPage() {
  let rows: Awaited<ReturnType<typeof buildCoverageMatrix>>['rows'] = []
  let summary: Awaited<ReturnType<typeof buildCoverageMatrix>>['summary'] = {
    modelsWithManuals: 0,
    totalModels: 0,
    totalDocumentSources: 0,
    localPdfCount: null,
    overallCoveragePercent: 0,
  }
  let error: string | null = null

  try {
    const [motorcycles, documentSources, localManuals] = await Promise.all([
      fetchMotorcycles(),
      fetchDocumentSources(),
      scanLocalManuals(),
    ])

    const result = buildCoverageMatrix(motorcycles, documentSources, localManuals)
    rows = result.rows
    summary = result.summary
  } catch (err) {
    error = err instanceof Error ? err.message : 'An unexpected error occurred'
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">
          Manual Coverage
        </h1>
        <p className="text-muted-foreground">
          Track which models have service manuals, owner&apos;s manuals, parts catalogs, and TSBs
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Error loading coverage data</p>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!error && (
        <>
          <div className="mb-6">
            <CoverageSummaryCards summary={summary} />
          </div>
          <ManualCoverageMatrix rows={rows} />
        </>
      )}
    </div>
  )
}
