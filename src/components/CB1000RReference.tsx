'use client'

import { useRef, useState } from 'react'
import { ChevronRight, Search, ListChevronsUpDown, ListChevronsDownUp } from 'lucide-react'
import { cb1000rSpecSections } from '@/lib/cb1000r'
import type { ServiceInterval } from '@/types/database.types'

export function CB1000RReference({ intervals }: { intervals?: ServiceInterval[] }) {
  const [query, setQuery] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)
  const setExpanded = (open: boolean) => {
    contentRef.current?.querySelectorAll('details').forEach(details => { details.open = open })
  }
  const [unit, setUnit] = useState<'km' | 'miles'>('km')
  const search = query.trim().toLowerCase()
  const matches = (text: string) => text.toLowerCase().includes(search)
  const rowClass = 'group border-b border-separator last:border-b-0'
  const summaryClass = 'flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm [&::-webkit-details-marker]:hidden'
  const chevron = <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
  const due = (item: ServiceInterval, first = false) => {
    const distance = unit === 'km' ? item.interval_km : item.interval_miles
    return `${first ? 'At' : 'Every'} ${[distance ? `${distance.toLocaleString('en-GB')} ${unit}` : null, item.interval_months ? `${item.interval_months} months` : null].filter(Boolean).join(' or ')}`
  }
  const serviceRow = (item: ServiceInterval, first = false) => (
    <details key={`${item.id}-${search}`} className={rowClass} open={search ? true : undefined}>
      <summary className={summaryClass}>
        <span className="min-w-0"><span className="block font-medium">{item.service_name}</span><span className="mt-1 block text-muted-foreground">{due(item, first)}</span></span>{chevron}
      </summary>
      <div className="space-y-2 px-4 pb-4 text-sm leading-relaxed text-muted-foreground">
        {item.description && <p>{item.description}</p>}
        {item.fluid_spec && <p><span className="font-medium text-foreground">Fluid: </span>{item.fluid_spec}</p>}
        {item.torque_spec && <p><span className="font-medium text-foreground">Torque: </span>{item.torque_spec}</p>}
      </div>
    </details>
  )
  const scheduleNotes = 'Honda schedule, page 3-4. The first service is one-off; other intervals repeat. Perform pre-ride checks too. Honda recommends dealer service for wheels and steering bearings; marked work requires suitable tools, service information and mechanical qualifications.'
  const notesMatch = matches(scheduleNotes)
  const filtered = intervals?.filter(item => matches([item.service_name, item.description, item.fluid_spec, item.torque_spec].join(' ')))
  const first = filtered?.find(item => item.service_name === 'First service (one-off)')
  const recurring = filtered?.filter(item => item.service_name !== 'First service (one-off)') ?? []
  const groups = [
    { title: 'Engine and cooling', test: /engine|fuel|air|crankcase|spark|valve|coolant|cooling/ },
    { title: 'Chain and clutch', test: /chain|clutch/ },
    { title: 'Brakes', test: /brake/ },
    { title: 'Chassis and controls', test: /./ },
  ]
  const sections = cb1000rSpecSections.map(section => ({ ...section, rows: section.rows.filter(row => matches(`${section.title} ${row.label} ${row.value}`)) })).filter(section => section.rows.length)
  const seen = new Set<string>()

  return <div ref={contentRef} className="space-y-5">
    <label className="flex items-center gap-3 rounded-[12px] bg-input px-4">
      <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input type="search" aria-label={intervals ? 'Search service' : 'Search specifications'} placeholder={intervals ? 'Search service…' : 'Search specifications…'} value={query} onChange={event => setQuery(event.target.value)} className="min-h-12 w-full min-w-0 bg-transparent text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
    </label>
    <div className="flex justify-end gap-2" role="group" aria-label="Section controls">
      <button type="button" aria-label="Expand all" title="Expand all" onClick={() => setExpanded(true)} className="flex h-11 w-11 items-center justify-center rounded-[10px] text-primary hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"><ListChevronsUpDown aria-hidden="true" className="h-4 w-4" /></button>
      <button type="button" aria-label="Collapse all" title="Collapse all" onClick={() => setExpanded(false)} className="flex h-11 w-11 items-center justify-center rounded-[10px] text-primary hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"><ListChevronsDownUp aria-hidden="true" className="h-4 w-4" /></button>
    </div>
    {intervals ? <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Distance or time, whichever comes first.</p>
        <div className="inline-flex rounded-[10px] bg-input p-1" role="group" aria-label="Distance units">
          {(['km', 'miles'] as const).map(value => <button key={value} type="button" aria-pressed={unit === value} onClick={() => setUnit(value)} className={`min-h-9 rounded-[8px] px-4 text-sm ${unit === value ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground'}`}>{value === 'km' ? 'Kilometres' : 'Miles'}</button>)}
        </div>
      </div>
      {first && <section className="overflow-hidden rounded-[12px] border border-separator"><h3 className="px-4 pt-3 text-xs text-muted-foreground">ONE-OFF</h3>{serviceRow(first, true)}</section>}
      {groups.map(group => {
        const items = recurring.filter(item => !seen.has(item.id) && group.test.test(item.service_name.toLowerCase()))
        items.forEach(item => seen.add(item.id))
        return items.length ? <section key={group.title}><h3 className="mb-2 px-4 text-sm font-medium">{group.title}</h3><div className="overflow-hidden rounded-[12px] bg-input">{items.map(item => serviceRow(item))}</div></section> : null
      })}
      {!filtered?.length && !notesMatch && <p role="status" className="py-6 text-center text-muted-foreground">No services match your search.</p>}
      {notesMatch && <details key={`notes-${search}`} open={search ? true : undefined} className="group rounded-[12px] bg-input"><summary className={summaryClass}>Schedule notes{chevron}</summary><p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">{scheduleNotes}</p></details>}
    </> : <>
      {sections.map(section => <details key={`${section.title}-${search}`} open={Boolean(search) || section.title === 'Engine'} className="group overflow-hidden rounded-[12px] bg-input">
        <summary className={`${summaryClass} font-medium`}>{section.title}{chevron}</summary>
        <dl className="border-t border-separator">
          {section.rows.map(row => {
            if (row.label === 'Gear ratios, 1st to 6th') return <div key={row.label} className="border-b border-separator px-4 py-3"><dt className="mb-3 text-sm text-muted-foreground">{row.label}</dt><dd className="grid grid-cols-3 gap-2 sm:grid-cols-6">{row.value.split(' / ').map((ratio, index) => <div key={ratio} className="rounded-lg bg-card p-2 text-center"><span className="block text-xs text-muted-foreground">Gear {index + 1}</span><span className="text-sm font-medium tabular-nums">{ratio}</span></div>)}</dd></div>
            const parts = row.label === 'Curb weight' ? [row.value] : row.value.split('; ')
            return <div key={row.label} className="border-b border-separator px-4 py-3 last:border-b-0">
              <div className="grid min-h-8 grid-cols-1 items-start gap-1 text-sm sm:grid-cols-2 sm:gap-4"><dt className="text-muted-foreground">{row.label}</dt><dd className="font-medium sm:text-right">{parts[0]}
              {parts.length > 1 && <details open={search ? true : undefined} className="mt-1 font-normal"><summary className="cursor-pointer text-xs text-primary">Details</summary><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{parts.slice(1).join('; ')}</p></details>}</dd></div>
            </div>
          })}
        </dl>
      </details>)}
      {!sections.length && <p role="status" className="py-6 text-center text-muted-foreground">No specifications match your search.</p>}
    </>}
  </div>
}
