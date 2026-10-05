'use client'

import { useRef, useState } from 'react'
import { ChevronRight, Search, ListChevronsUpDown, ListChevronsDownUp } from 'lucide-react'

interface BikeFluidsProps {
  items: { label: string; capacity: string | null; spec: string | null }[]
  note?: string
}

export function BikeFluids({ items, note = 'Quantities depend on the service being performed. Check the model-specific procedure.' }: BikeFluidsProps) {
  const [query, setQuery] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)
  const setExpanded = (open: boolean) => {
    contentRef.current?.querySelectorAll('details').forEach(details => { details.open = open })
  }
  const search = query.trim().toLowerCase()
  const fluids = items.filter(fluid => [fluid.label, fluid.capacity, fluid.spec].join(' ').toLowerCase().includes(search))

  return <div ref={contentRef} className="space-y-5">
    <label className="flex items-center gap-3 rounded-[12px] bg-input px-4">
      <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input type="search" aria-label="Search fluids" placeholder="Search fluids…" value={query} onChange={event => setQuery(event.target.value)} className="min-h-12 w-full min-w-0 bg-transparent text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
    </label>
    <div className="flex justify-end gap-2" role="group" aria-label="Section controls">
      <button type="button" aria-label="Expand all" title="Expand all" onClick={() => setExpanded(true)} className="flex h-11 w-11 items-center justify-center rounded-[10px] text-primary hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"><ListChevronsUpDown aria-hidden="true" className="h-4 w-4" /></button>
      <button type="button" aria-label="Collapse all" title="Collapse all" onClick={() => setExpanded(false)} className="flex h-11 w-11 items-center justify-center rounded-[10px] text-primary hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"><ListChevronsDownUp aria-hidden="true" className="h-4 w-4" /></button>
    </div>
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
    <p className="text-xs leading-relaxed text-muted-foreground">{note}</p>
  </div>
}
