import { VinDecoder } from '@/components/VinDecoder'
import { PageContainer, PageHeader } from '@/components/PageHeader'

export default function VinPage() {
  return (
    <PageContainer>
      <PageHeader
        title="VIN Decoder"
        subtitle="Decode your motorcycle's Vehicle Identification Number using NHTSA data."
      />
      <VinDecoder />
    </PageContainer>
  )
}
