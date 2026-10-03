import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { PageContainer, PageHeader } from '@/components/PageHeader'
import { BikeDetailTabs } from '@/components/BikeDetailTabs'
import { SafeDisclaimer } from '@/components/SafeDisclaimer'
import { cb1000r, cb1000rDocuments, cb1000rImage, cb1000rServiceIntervals } from '@/lib/cb1000r'

export const metadata: Metadata = { title: 'Honda CB1000R SC60', description: 'Honda CB1000R SC60 reference, factory wiring sheets and an interactive brake-light lesson.' }

export default function CB1000RPage() {
  return <PageContainer>
    <Link href="/bikes" className="text-[15px] text-link hover:underline">All bikes</Link>
    <div className="my-6 grid items-center gap-6 md:grid-cols-2 md:gap-10">
      <figure>
        <Image src={cb1000rImage.image_url} alt={cb1000rImage.alt_text} width={1536} height={1024} sizes="(min-width: 768px) 480px, 100vw" className="h-auto w-full rounded-[20px]" priority />
        <figcaption className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
          Honda CB1000R SC60 · reference illustration
        </figcaption>
      </figure>
      <PageHeader title="Honda CB1000R" subtitle="SC60 · 2008 manual reference · 998 cc inline-four" />
    </div>
    <p className="mb-5 text-[15px] text-muted-foreground">ABS equipment is unconfirmed. Both factory diagrams are labelled by variant. This reference covers the supplied 2008 manual; it does not establish your bike’s model year from its certificate date. Your certificate lists 77 kW; the catalogue’s 92 kW rating is for the unrestricted model.</p>
    <BikeDetailTabs motorcycle={cb1000r} documents={cb1000rDocuments} serviceIntervals={cb1000rServiceIntervals} />
    <div className="mt-6"><SafeDisclaimer /></div>
  </PageContainer>
}
