import Link from 'next/link'
import { ChevronRight, WifiOff, Smartphone, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BikeThumb } from '@/components/BikeThumb'
import { Onboarding } from '@/components/Onboarding'
import { GarageStrip } from '@/components/home/GarageStrip'
import { ProductWindow } from '@/components/home/ProductWindow'
import { HomeHighlights } from '@/components/home/HomeHighlights'
import { SafeDisclaimer } from '@/components/SafeDisclaimer'
import { getGarageBikeData } from '@/lib/garageBikes.server'
import { SITE_STATS } from '@/lib/siteStats'

// Bike list changes rarely; refresh it at most hourly
export const revalidate = 3600

const GARAGE_FEATURES = [
  { icon: WifiOff, title: 'Works offline.', body: "Pages you've opened keep working without signal." },
  { icon: Smartphone, title: 'Add to Home Screen.', body: 'Installs like an app. No app store, no updates to wait for.' },
  { icon: Lock, title: 'Browse without an account.', body: 'Sign in to save your garage.' },
]

export default async function Home() {
  const { bikes, universalTreeCount } = await getGarageBikeData()
  const featuredBikes = bikes.filter((bike) => bike.imageUrl).slice(0, 4)

  return (
    <div className="bg-card">
      <Onboarding bikes={bikes} universalTreeCount={universalTreeCount} />

      {/* Returning users see their bikes first */}
      <div className="bg-background">
        <GarageStrip bikes={bikes} />
      </div>

      {/* Hero */}
      <section className="px-[22px] pb-4 pt-16 text-center sm:pt-[88px]" style={{ animation: 'riseIn 0.6s ease-out both' }}>
        <p className="text-[21px] font-semibold text-[#F2581C]">CrankDoc</p>
        <h1 className="mx-auto mt-2.5 max-w-[900px] text-[44px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[64px] lg:text-[80px]">
          Every fault has a reason.
          <br />
          Find it.
        </h1>
        <p className="mx-auto mt-5 max-w-[640px] text-[19px] leading-snug tracking-[-0.015em] text-muted-foreground sm:text-[24px]">
          Step-by-step diagnostics for {SITE_STATS.modelCount} motorcycles and scooters. Free, no account, and it works offline.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3.5">
          <Button asChild>
            <Link href="/diagnose">Start diagnosing</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dtc">Look up a code</Link>
          </Button>
        </div>
      </section>

      <div className="px-[22px] pt-12 sm:pt-16">
        <ProductWindow />
      </div>

      <div className="mt-24 bg-background sm:mt-32">
        <HomeHighlights />
      </div>

      {/* Made for the garage */}
      <section aria-labelledby="garage-features-title" className="bg-black px-[22px] py-24 text-center text-[#F5F5F7] sm:py-28">
        <h2 id="garage-features-title" className="mx-auto max-w-[820px] text-[40px] font-semibold leading-[1.07] tracking-[-0.028em] sm:text-[56px]">
          Made for the garage.
          <br />
          <span className="text-[#86868B]">Not the office.</span>
        </h2>
        <div className="mx-auto mt-16 grid max-w-[960px] grid-cols-1 gap-10 text-left sm:grid-cols-3">
          {GARAGE_FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <Icon aria-hidden="true" className="h-[34px] w-[34px]" strokeWidth={1.6} />
              <h3 className="mt-4 text-[21px] font-semibold">{title}</h3>
              <p className="mt-2 text-[17px] leading-relaxed text-[#A1A1A6]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bikes */}
      {featuredBikes.length > 0 && (
        <section aria-labelledby="bikes-title" className="px-[22px] pb-10 pt-24 sm:pt-28">
          <div className="mx-auto max-w-[1024px]">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 id="bikes-title" className="text-[40px] font-semibold leading-[1.07] tracking-[-0.028em] sm:text-[56px]">
                Find your ride.
              </h2>
              <Link href="/bikes" className="inline-flex items-center text-[17px] text-link hover:underline">
                See all {bikes.length} models <ChevronRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
            <ul className="mt-9 grid grid-cols-2 gap-5 lg:grid-cols-4">
              {featuredBikes.map((bike) => (
                <li key={bike.id}>
                  <Link href={`/bikes/${bike.id}`} className="group block">
                    <BikeThumb
                      imageUrl={bike.imageUrl}
                      alt={bike.imageAlt ?? `${bike.make} ${bike.model}`}
                      className="aspect-[4/3] w-full rounded-[20px] transition-opacity group-hover:opacity-90"
                    />
                    <div className="mt-3 text-[13px] text-muted-foreground">{bike.make}</div>
                    <div className="text-[19px] font-semibold">{bike.model}</div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Closing CTA */}
      <section className="px-[22px] pb-24 pt-20 text-center sm:pb-28">
        <h2 className="text-[40px] font-semibold leading-[1.07] tracking-[-0.028em] sm:text-[56px]">Ready when your bike isn&apos;t.</h2>
        <Button asChild className="mt-7">
          <Link href="/diagnose">Start diagnosing</Link>
        </Button>
      </section>

      <div className="bg-background px-[22px] py-8">
        <div className="mx-auto max-w-[1024px]">
          <SafeDisclaimer />
        </div>
      </div>
    </div>
  )
}
