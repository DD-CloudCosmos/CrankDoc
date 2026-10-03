import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { SafetyBadge } from '@/components/SafetyBadge'
import { SITE_STATS } from '@/lib/siteStats'
import mt07Intervals from '../../../data/service-intervals/mt07.json'
import bmwCodes from '../../../data/dtc/bmw.json'
import showcaseTree from '../../../data/trees/bmw-r1250gs-wont-start.json'
import type { DecisionTreeData } from '@/types/database.types'

/** "123 lb-ft (43 Nm)" → "43 Nm" */
function metricTorque(spec: string | null): string | null {
  const match = spec?.match(/\((\d+(?:\.\d+)?) Nm\)/)
  return match ? `${match[1]} Nm` : null
}

function findInterval(name: string) {
  return mt07Intervals.intervals.find((interval) => interval.service_name === name)
}

const oil = findInterval('Engine Oil Change')
const plug = findInterval('Spark Plugs')
const chain = findInterval('Chain Adjustment')

const SPEC_ROWS = [
  { label: 'Drain plug', value: metricTorque(oil?.torque_spec ?? null) },
  { label: 'Spark plug', value: metricTorque(plug?.torque_spec ?? null) },
  { label: 'Engine oil', value: '10W-40 · 1.7 L' },
  { label: 'Rear axle nut', value: metricTorque(chain?.torque_spec ?? null) },
].filter((row): row is { label: string; value: string } => row.value !== null)

const featuredCode = bmwCodes.find((code) => code.code === 'P0107') ?? bmwCodes[0]
const firstQuestion = (showcaseTree.tree_data as DecisionTreeData).nodes[0]

/** "Get the highlights" tiles on the landing page, filled from seed data. */
export function HomeHighlights() {
  return (
    <section aria-labelledby="highlights-title" className="px-[22px] py-24 sm:py-28">
      <div className="mx-auto max-w-[1024px]">
        <h2 id="highlights-title" className="text-[40px] font-semibold leading-[1.07] tracking-[-0.028em] sm:text-[56px]">
          Get the highlights.
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Guided questions */}
          <article className="flex min-h-[420px] flex-col overflow-hidden rounded-[28px] bg-card px-8 pt-9 shadow-card sm:px-9">
            <h3 className="text-[28px] font-semibold leading-tight tracking-[-0.02em]">
              One question
              <br />
              at a time.
            </h3>
            <p className="mt-2.5 text-[17px] leading-relaxed text-muted-foreground">
              {SITE_STATS.treeCount} guides narrow it down the way a good mechanic would.
            </p>
            <div className="mt-auto pt-7">
              <div className="rounded-t-[18px] bg-background px-4 pb-2 pt-4">
                <div className="text-[17px] font-semibold">{firstQuestion.text}</div>
                <ul className="mt-3 overflow-hidden rounded-[12px] bg-card text-[15px]">
                  {(firstQuestion.options ?? []).slice(0, 3).map((option) => (
                    <li key={option.text} className="border-b border-separator px-3.5 py-3 last:border-b-0">
                      {option.text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>

          {/* Specs */}
          <article className="flex min-h-[420px] flex-col rounded-[28px] bg-card p-8 shadow-card sm:p-9">
            <h3 className="text-[28px] font-semibold leading-tight tracking-[-0.02em]">
              The right number,
              <br />
              right there.
            </h3>
            <p className="mt-2.5 text-[17px] leading-relaxed text-muted-foreground">
              Torque, fluids and intervals for {SITE_STATS.serviceIntervalCount} service jobs.
            </p>
            <dl className="mt-auto overflow-hidden rounded-[16px] bg-background text-[15px]">
              {SPEC_ROWS.map((row) => (
                <div key={row.label} className="flex justify-between gap-4 border-b border-separator px-4 py-3 last:border-b-0">
                  <dt>{row.label}</dt>
                  <dd className="text-muted-foreground">{row.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-2.5 text-[13px] text-muted-foreground">
              {mt07Intervals.motorcycle_make} {mt07Intervals.motorcycle_model}
            </div>
          </article>

          {/* Fault codes — always dark, like a scan tool screen */}
          <article className="flex min-h-[360px] flex-col rounded-[28px] bg-[#1D1D1F] p-8 text-[#F5F5F7] sm:p-9">
            <h3 className="text-[28px] font-semibold leading-tight tracking-[-0.02em]">
              {SITE_STATS.dtcCount} fault codes.
              <br />
              In plain English.
            </h3>
            <p className="mt-2.5 text-[17px] leading-relaxed text-[#A1A1A6]">
              From {SITE_STATS.dtcManufacturerCount} manufacturers, with what usually causes them.
            </p>
            <Link
              href={`/dtc?q=${featuredCode.code}`}
              className="mt-auto block rounded-[16px] bg-[#2C2C2E] p-4 transition-colors hover:bg-[#3A3A3C]"
            >
              <div className="flex items-center justify-between">
                <span className="text-[22px] font-semibold tracking-[-0.01em]">{featuredCode.code}</span>
                <span className="rounded-full bg-[rgba(255,69,58,0.2)] px-2.5 py-1 text-[12px] font-semibold capitalize text-[#FF8A80]">
                  {featuredCode.severity}
                </span>
              </div>
              <div className="mt-1.5 text-[15px] text-[#E5E5EA]">{featuredCode.description}</div>
            </Link>
          </article>

          {/* Safety */}
          <article className="flex min-h-[360px] flex-col rounded-[28px] bg-card p-8 shadow-card sm:p-9">
            <h3 className="text-[28px] font-semibold leading-tight tracking-[-0.02em]">
              Knows when to
              <br />
              call a pro.
            </h3>
            <p className="mt-2.5 text-[17px] leading-relaxed text-muted-foreground">
              Every step is safety-rated, so you know what&apos;s a Saturday job.
            </p>
            <div className="mt-auto flex flex-wrap gap-2">
              <SafetyBadge level="green" className="px-3.5 py-2 text-[15px]" />
              <SafetyBadge level="yellow" className="px-3.5 py-2 text-[15px]" />
              <SafetyBadge level="red" className="px-3.5 py-2 text-[15px]" />
            </div>
            <Link href="/diagnose" className="mt-5 inline-flex items-center gap-0.5 text-[17px] text-link hover:underline">
              Browse all guides <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </article>
        </div>
      </div>
    </section>
  )
}
