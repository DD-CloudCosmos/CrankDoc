import type { Metadata } from 'next'
import Link from 'next/link'
import { PageContainer, PageHeader } from '@/components/PageHeader'
import { BikeDetailTabs } from '@/components/BikeDetailTabs'
import { SafeDisclaimer } from '@/components/SafeDisclaimer'
import { cb1000r, cb1000rDocuments } from '@/lib/cb1000r'

export const metadata: Metadata = { title: 'Honda CB1000R SC60', description: 'Honda CB1000R SC60 reference, factory wiring sheets and an interactive brake-light lesson.' }

export default function CB1000RPage() {
  return <PageContainer>
    <Link href="/bikes" className="text-[15px] text-link hover:underline">All bikes</Link>
    <PageHeader title="Honda CB1000R" subtitle="SC60 · 2008 manual reference · 998 cc inline-four" />
    <p className="mb-5 text-[15px] text-muted-foreground">ABS equipment is unconfirmed. Both factory diagrams are labelled by variant. This reference covers the supplied 2008 manual; it does not establish your bike’s model year from its certificate date.</p>
    <BikeDetailTabs motorcycle={cb1000r} documents={cb1000rDocuments} serviceIntervals={[]} />
    <div className="mt-6"><SafeDisclaimer /></div>
  </PageContainer>
}
