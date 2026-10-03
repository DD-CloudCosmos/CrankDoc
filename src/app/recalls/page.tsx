import { Suspense } from 'react'
import { RecallList } from '@/components/RecallList'
import { PageContainer, PageHeader } from '@/components/PageHeader'

export default function RecallsPage() {
  return (
    <PageContainer>
      <PageHeader title="Recalls" subtitle="Search NHTSA safety recalls by make, model, or year." />
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
        <RecallList />
      </Suspense>
    </PageContainer>
  )
}
