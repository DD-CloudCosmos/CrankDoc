'use client'

import { useState } from 'react'
import { ChevronRight, Search } from 'lucide-react'
import { cb1000rFluids } from '@/lib/cb1000r'

export function CB1000RFluids() {
  const [query, setQuery] = useState('')
  const search = query.trim().toLowerCase()
  const fluids = cb1000rFluids.filter(fluid => [fluid.label, fluid.capacity, fluid.spec].join(' ').toLowerCase().includes(search))

  return <div className="space-y-5">
    <label className="flex items-center gap-3 rounded-[12px] bg-input px-4">
      <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input type="search" aria-label="Search fluids" placeholder="Search fluids…" value={query} onChange={event => setQuery(event.target.value)} className="min-h-12 w-full min-w-0 bg-transparent text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
    </label>
    <div className="overflow-hidden rounded-[12px] bg-input">
      {fluids.map(fluid => <details key={`${fluid.label}-${search}`} open={search ? true : undefined} className="group border-b border-separator last:border-b-0">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
          {fluid.label}<ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
        </summary>
        <dl className="space-y-4 px-4 pb-4 text-sm leading-relaxed">
          {fluid.capacity && <div><dt className="mb-1 text-xs text-muted-foreground">Quantity</dt><dd>{fluid.capacity}</dd></div>}
          {fluid.spec && <div><dt className="mb-1 text-xs text-muted-foreground">Specification</dt><dd>{fluid.spec}</dd></div>}
        </dl>
      </details>)}
    </div>
    {!fluids.length && <p role="status" className="py-6 text-center text-muted-foreground">No fluids match your search.</p>}
    <p className="text-xs leading-relaxed text-muted-foreground">Quantities depend on the service being performed. Check the CB1000R or CB1000RA procedure where values differ.</p>
  </div>
}
