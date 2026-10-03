import { GlossaryList } from '@/components/GlossaryList'
import { PageContainer, PageHeader } from '@/components/PageHeader'

export default function GlossaryPage() {
  return (
    <PageContainer>
      <PageHeader title="Glossary" subtitle="Motorcycle and scooter terms, explained, with technical drawings for the parts that matter." />
      <GlossaryList />
    </PageContainer>
  )
}
