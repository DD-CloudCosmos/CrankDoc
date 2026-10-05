import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { PageContainer, PageHeader } from '@/components/PageHeader'
import { BikeDetailTabs } from '@/components/BikeDetailTabs'
import { SafeDisclaimer } from '@/components/SafeDisclaimer'
import { cb650r, cb650rServiceIntervals, cb650rManualUrl, cb650rPressUrl } from '@/lib/cb650r'

export const metadata: Metadata = {
  title: 'Honda CB650RA · 2023',
  description: '2023 Honda CB650RA European ABS specifications, service schedule and fluids, verified against Honda’s owner’s manual.',
}

export default function CB650RPage() {
  return <PageContainer>
    <Link href="/bikes" className="text-[15px] text-link hover:underline">All bikes</Link>
    <div className="my-6 grid items-center gap-6 md:grid-cols-2 md:gap-10">
      <figure>
        <Image src={cb650r.image_url!} alt="2023 Honda CB650RA reference illustration in red, with round LED headlight, inline-four engine and two-sided swingarm" width={1450} height={1085} sizes="(min-width: 768px) 480px, 100vw" className="h-auto w-full rounded-[20px]" priority />
        <figcaption className="mt-2 text-[12px] leading-relaxed text-muted-foreground">Honda CB650RA · 2023 reference illustration</figcaption>
      </figure>
      <PageHeader title="Honda CB650RA" subtitle="2023 · European ABS model · 649 cc inline-four" />
    </div>
    <p className="mb-5 text-[15px] text-muted-foreground">Marketed as the CB650R. These figures cover the European ABS model with a manual clutch. Power figures describe the unrestricted version; A2-restricted bikes differ.</p>
    <BikeDetailTabs motorcycle={cb650r} documents={[]} serviceIntervals={cb650rServiceIntervals} />
    <details className="mt-4 rounded-[14px] bg-input p-4 text-[13px] text-muted-foreground">
      <summary className="cursor-pointer font-medium text-foreground">Sources and model notes</summary>
      <div className="mt-3 space-y-3">
        <p>Honda’s 2023 European owner’s manual (32MKYH100): schedule pages 69–70, chain page 94, clutch page 95, specifications pages 131–133. This page links to Honda’s manual rather than redistributing it.</p>
        <p>Dimensions and curb weight follow the manual: 2,120 mm long and 203 kg for European ED types. Honda’s launch sheet instead lists 2,130 mm and 202.5 kg. Whole-bike dry weight is not given. Power, torque and suspension details come from the 2023 launch sheet.</p>
        <p>Valve-clearance values, workshop torques, fork-fluid quantities and factory wiring diagrams are not supplied by this owner’s manual. Consult the correct workshop manual for that work. The 2024 redesign and E-Clutch specifications do not apply.</p>
        <p>The bike image is an AI-generated reference illustration guided by Honda’s 2023 photograph. Use the manual for mechanical work.</p>
        <div className="flex flex-wrap gap-x-4 gap-y-3">
          <a href={cb650rManualUrl} target="_blank" rel="noreferrer" className="text-link hover:underline">Honda 2023 owner’s manual</a>
          <a href={cb650rPressUrl} target="_blank" rel="noreferrer" className="text-link hover:underline">Honda 2023 model reference</a>
        </div>
      </div>
    </details>
    <div className="mt-6"><SafeDisclaimer /></div>
  </PageContainer>
}
