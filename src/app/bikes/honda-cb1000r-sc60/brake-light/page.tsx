import type { Metadata } from 'next'
import Link from 'next/link'
import { PageContainer, PageHeader } from '@/components/PageHeader'
import { BrakeLightExplorer } from '@/components/circuits/BrakeLightExplorer'
import { SafeDisclaimer } from '@/components/SafeDisclaimer'

export const metadata: Metadata = { title: 'Learn the CB1000R brake-light circuit', description: 'Follow the Honda SC60 brake-light connections, learn the wire codes and operate two parallel brake switches.' }

interface PageProps { searchParams: Promise<{ mode?: string }> }

export default async function BrakeLightPage({ searchParams }: PageProps) {
  const { mode } = await searchParams
  return <PageContainer>
    <Link href="/bikes/honda-cb1000r-sc60" className="text-[15px] text-link hover:underline">Honda CB1000R reference</Link>
    <PageHeader title="Follow the circuit" subtitle="Your Honda’s wiring, one connection at a time." />
    <div className="rounded-[20px] bg-card p-4 shadow-card sm:p-6"><BrakeLightExplorer initialMode={mode === 'explore' ? 'explore' : 'learn'} /></div>
    <div className="mt-6"><SafeDisclaimer /></div>
  </PageContainer>
}
