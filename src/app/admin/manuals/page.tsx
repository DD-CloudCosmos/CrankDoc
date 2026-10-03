import { buildCoverageMatrix } from '@/lib/manuals'
import { fetchMotorcycles, fetchDocumentSources, listStorageManuals } from '@/lib/manuals.server'
import { CoverageSummaryCards } from '@/components/admin/CoverageSummaryCards'
import { ManualCoverageMatrix } from '@/components/admin/ManualCoverageMatrix'
import { PageContainer, PageHeader } from '@/components/PageHeader'

export const dynamic = 'force-dynamic'

export default async function AdminManualsPage() {
  let rows: Awaited<ReturnType<typeof buildCoverageMatrix>>['rows'] = []
  let summary: Awaited<ReturnType<typeof buildCoverageMatrix>>['summary'] = {
    modelsWithManuals: 0,
    totalModels: 0,
    totalDocumentSources: 0,
    storagePdfCount: null,
    overallCoveragePercent: 0,
  }
  let error: string | null = null

  try {
    const [motorcycles, documentSources, storageManuals] = await Promise.all([
      fetchMotorcycles(),
      fetchDocumentSources(),
      listStorageManuals(),
    ])

    const result = buildCoverageMatrix(motorcycles, documentSources, storageManuals)
    rows = result.rows
    summary = result.summary
  } catch (err) {
    error = err instanceof Error ? err.message : 'An unexpected error occurred'
  }

  return (
    <PageContainer>
      <PageHeader
        title="Manual Coverage"
        subtitle="Track which models have service manuals, owner's manuals, parts catalogs, and TSBs"
      />

      {error && (
        <div role="alert" className="mb-6 rounded-[14px] bg-danger-background p-4 text-danger-foreground">
          <p className="font-semibold">Error loading coverage data</p>
          <p className="text-[15px]">{error}</p>
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
    </PageContainer>
  )
}
