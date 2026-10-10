'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { BikeThumb } from '@/components/BikeThumb'
import { formatBikeMileage, type BikeView } from '@/lib/garageBikes'
import { BikeForm } from '../BikeForm'
import { useGarageOwner } from '../PrivateGarage'
import { saveBike, setArchived, deleteBike } from '../actions'

export function BikeWorkspace({ bike: initial }: { bike: BikeView }) {
  const owner = useGarageOwner()
  const router = useRouter()
  const [bike, setBike] = useState(initial)
  const [tab, setTab] = useState<'overview' | 'maintenance' | 'details'>('overview')
  const [unit, setUnit] = useState<'km' | 'mi'>('km')
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const cancel = useRef<HTMLButtonElement>(null)
  const remove = useRef<HTMLButtonElement>(null)
  useEffect(() => { if (confirm) cancel.current?.focus() }, [confirm])
  async function archive() {
    setBusy(true); setError('')
    try { await setArchived(bike.id, !bike.archivedAt, owner); setBike({ ...bike, archivedAt: bike.archivedAt ? null : new Date().toISOString() }) }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not archive bike.') }
    finally { setBusy(false) }
  }
  async function removeConfirmed() {
    setBusy(true); setError('')
    try { await deleteBike(bike.id, true, owner); router.push('/garage') }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not remove bike.') }
    finally { setBusy(false) }
  }
  return <div className="space-y-5">
    <Link href="/garage" prefetch={false} className="inline-block min-h-11 py-3 text-link">My Garage</Link>
    <h1 className="break-words text-[34px] font-semibold tracking-[-0.03em]">{bike.nickname || `${bike.make} ${bike.model}`}</h1>
    {bike.archivedAt && <p>Archived bike</p>}
    <BikeThumb imageUrl={bike.libraryImageUrl} alt={`${bike.make} ${bike.model}`} className="h-52 w-full rounded-[20px]" />
    <SegmentedControl aria-label="Bike workspace" className="w-full [&_button]:min-h-11 [&_button]:whitespace-nowrap [&_button]:px-2" value={tab} onChange={setTab} options={[{ value: 'overview', label: 'Overview' }, { value: 'maintenance', label: 'Maintenance' }, { value: 'details', label: 'Bike details' }]} />
    <section className="space-y-4 rounded-[20px] bg-card p-5 shadow-card">
      {tab === 'overview' && <><p>{bike.make} {bike.model} · {bike.year ?? 'Year not recorded'}</p><p>{formatBikeMileage(bike.mileageKm, unit)}</p><div><label htmlFor="workspace-unit" className="mr-3">Display mileage</label><select id="workspace-unit" className="min-h-11 rounded-[10px] bg-input px-3" value={unit} onChange={event => setUnit(event.target.value as 'km' | 'mi')}><option value="km">Kilometres</option><option value="mi">Miles</option></select></div><p className="text-muted-foreground">No maintenance recorded</p>{bike.modelReferenceUrl ? <Link className="block min-h-11 py-3 text-link" href={bike.modelReferenceUrl}>Model reference</Link> : <p className="text-muted-foreground">Reference unavailable until a supported model and year are confirmed.</p>}{bike.motorcycleId && <Link className="block min-h-11 py-3 text-link" href={`/diagnose?bike=${bike.motorcycleId}`}>Diagnostic guides</Link>}</>}
      {tab === 'maintenance' && <><h2 className="text-[22px] font-semibold">Maintenance</h2><p>No maintenance recorded</p><p className="text-muted-foreground">Maintenance logging is coming in the next stage. No service history or due dates have been assumed.</p></>}
      {tab === 'details' && <><h2 className="text-[22px] font-semibold">Bike details</h2><BikeForm initial={bike} onSave={async input => { const saved = await saveBike(input, bike.id, owner, true); setBike(saved); return saved }} /><div className="flex flex-wrap gap-3 border-t border-separator pt-5"><Button variant="outline" disabled={busy} onClick={() => void archive()}>{bike.archivedAt ? 'Restore bike' : 'Archive bike'}</Button><Button ref={remove} variant="outline" disabled={busy} onClick={() => setConfirm(true)}>Remove bike</Button></div></>}
      {error && <p role="alert">{error}</p>}
    </section>
    {confirm && <div role="alertdialog" aria-modal="true" aria-labelledby="remove-title" aria-describedby="remove-description" className="fixed inset-0 z-[60] flex items-center justify-center bg-background/90 p-5" onKeyDown={event => {
      if (event.key === 'Escape' && !busy) { setConfirm(false); remove.current?.focus() }
      if (event.key === 'Tab') { event.preventDefault(); const buttons = event.currentTarget.querySelectorAll('button'); const next = document.activeElement === buttons[0] ? buttons[1] : buttons[0]; (next as HTMLButtonElement)?.focus() }
    }}><div className="max-w-sm space-y-4 rounded-[20px] bg-card p-5 shadow-card"><h2 id="remove-title" className="text-[22px] font-semibold">Remove this bike?</h2><p id="remove-description">This permanently removes the bike. Archive it to keep its history.</p><div className="flex flex-wrap gap-3"><Button ref={cancel} variant="outline" disabled={busy} onClick={() => { setConfirm(false); remove.current?.focus() }}>Cancel removal</Button><Button disabled={busy} onClick={() => void removeConfirmed()}>Confirm removal</Button></div>{error && <p role="alert">{error}</p>}</div></div>}
  </div>
}
