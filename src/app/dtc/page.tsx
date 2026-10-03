import { DtcCodeList } from '@/components/DtcCodeList'
import { PageContainer, PageHeader } from '@/components/PageHeader'
import { SITE_STATS } from '@/lib/siteStats'

interface PageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function DtcPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const initialQuery = typeof params.q === 'string' ? params.q.slice(0, 50) : ''

  return (
    <PageContainer>
      <PageHeader
        title="Fault Codes"
        subtitle={`Look up ${SITE_STATS.dtcCount} motorcycle fault codes from ${SITE_STATS.dtcManufacturerCount} manufacturers by code, system or symptom.`}
      />
      <DtcCodeList initialQuery={initialQuery} />
    </PageContainer>
  )
}
