'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { BikePhotoEditor, PrivateBikePhoto } from './BikePhotoEditor'
import { formatBikeMileage, type BikeView, type BikeInput } from '@/lib/garageBikes'
import { BikeForm, type CatalogueOption } from '../BikeForm'
import { QuickJobForm } from './QuickJobForm'
import { MaintenanceHistory } from './MaintenanceHistory'
import { MaintenanceRecord } from './MaintenanceRecord'
import type { JobView, PrivateFile, SavedResult } from '@/lib/maintenance/types'
import { useGarageOwner, useGarageReconciliation } from '../PrivateGarage'
import { loadMaintenanceJob, saveBike, setArchived, deleteBike, loadBikeWorkspace, saveQuickJob, startMaintenanceJob, correctJob, removeJob } from '../actions'

import { TemplatePicker } from './TemplatePicker'
import { reviewedTemplates } from '@/lib/maintenance/templates'
import { loadTemplates, savePersonalTemplate, startTemplateMaintenance } from '../actions'
import type { Template } from '@/lib/maintenance/types'

import { previousActivity } from '@/lib/maintenance/carryover'

const emptyJobs: JobView[] = []

export function BikeWorkspace({ bike: initial, jobs: initialJobs = emptyJobs,models=[] }: { bike: BikeView; jobs?: JobView[];models?:CatalogueOption[] }) {
  const owner = useGarageOwner()
  const router = useRouter()
  const [bike, setBike] = useState(initial)
  const [jobs,setJobs]=useState(initialJobs)
  const [files,setFiles]=useState<PrivateFile[]>([])
  const [logging,setLogging]=useState(false)
  const [templates,setTemplates]=useState<Template[]>([])
  const [showTemplates,setShowTemplates]=useState(false)
  const generation=useRef(0)
  const props=useRef({bike:initial,jobs:initialJobs})
  const [tab, setTab] = useState<'overview' | 'maintenance' | 'details'>('overview')
  const [unit, setUnit] = useState<'km' | 'mi'>('km')
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pending = useRef(false)
  const cancel = useRef<HTMLButtonElement>(null)
  const remove = useRef<HTMLButtonElement>(null)
  useEffect(() => { if (confirm) cancel.current?.focus() }, [confirm])
  useEffect(()=>{
    if(props.current.bike===initial && props.current.jobs===initialJobs) return
    props.current={bike:initial,jobs:initialJobs}
    if(!pending.current) {generation.current++;setBike(initial);setJobs(initialJobs)}
  },[initial,initialJobs])
  const reconcile=useCallback(async()=>{
    if(pending.current) return
    const current=++generation.current
    const fresh=await loadBikeWorkspace(initial.id,owner)
    if(current===generation.current && !pending.current) {setBike(fresh.bike);setJobs(fresh.jobs);setFiles(fresh.files??[])}
  },[initial.id,owner])
  useGarageReconciliation(reconcile)
  function rememberJob(job:JobView) {setJobs(current=>[...current.filter(item=>item.id!==job.id),job])}
  async function mutateJob<T>(write:()=>Promise<SavedResult<T>>,onSaved:(value:T)=>void):Promise<SavedResult<T>> {
    if(pending.current) throw new Error('Another change is still saving. Try again after it finishes.')
    pending.current=true;generation.current++;setBusy(true);setError('')
    try {
      const result=await write()
      if(result.ok) {
        onSaved(result.value)
        try {const fresh=await loadBikeWorkspace(bike.id,owner);setBike(fresh.bike);setJobs(fresh.jobs);setFiles(fresh.files??[])}
        catch {setError('Record saved. Refresh this page to load the latest mileage and history.')}
      }
      return result
    } finally {pending.current=false;setBusy(false)}
  }

  async function archive() {
    if (pending.current) return
    pending.current = true
    generation.current++
    const archived = !bike.archivedAt
    setBusy(true); setError('')
    try { await setArchived(bike.id, archived, owner); setBike(current => ({ ...current, archivedAt: archived ? new Date().toISOString() : null })) }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not archive bike.') }
    finally { pending.current = false; setBusy(false) }
  }
  async function removeConfirmed() {
    if (pending.current) return
    pending.current = true
    generation.current++
    setBusy(true); setError('')
    try { await deleteBike(bike.id, true, owner); router.push('/garage') }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not remove bike.') }
    finally { pending.current = false; setBusy(false) }
  }
  async function save(input: BikeInput) {
    if (pending.current) throw new Error('Another change is still saving. Try again after it finishes.')
    pending.current = true
    generation.current++
    setBusy(true)
    try {
      const saved = await saveBike(input, bike.id, owner, true)
      setBike(saved)
      return saved
    } finally { pending.current = false; setBusy(false) }
  }
  return <div className="space-y-5">
    <Link href="/garage" prefetch={false} className="inline-block min-h-11 py-3 text-link">My Garage</Link>
    <h1 className="break-words text-[34px] font-semibold tracking-[-0.03em]">{bike.nickname || `${bike.make} ${bike.model}`}</h1>
    {bike.archivedAt && <p>Archived bike</p>}
    <PrivateBikePhoto bike={bike} className="h-52 w-full rounded-[20px]" />
    <BikePhotoEditor bike={bike} files={files} onChanged={()=>void reconcile().catch(()=>setError('File saved. Refresh to load the latest photos and receipts.'))} disabled={busy} />
    <SegmentedControl aria-label="Bike workspace" className="w-full [&_button]:min-h-11 [&_button]:whitespace-nowrap [&_button]:px-2" value={tab} onChange={setTab} options={[{ value: 'overview', label: 'Overview' }, { value: 'maintenance', label: 'Maintenance' }, { value: 'details', label: 'Bike details' }]} />
    <section className="space-y-4 rounded-[20px] bg-card p-5 shadow-card">
      {tab === 'overview' && <><p>{bike.make} {bike.model} · {bike.year ?? 'Year not recorded'}</p><p>{formatBikeMileage(bike.mileageKm, unit)}</p><div><label htmlFor="workspace-unit" className="mr-3">Display mileage</label><select id="workspace-unit" className="min-h-11 rounded-[10px] bg-input px-3" value={unit} onChange={event => setUnit(event.target.value as 'km' | 'mi')}><option value="km">Kilometres</option><option value="mi">Miles</option></select></div>{jobs.length===0?<p className="text-muted-foreground">No maintenance recorded</p>:<div className="space-y-3"><h2 className="text-[22px] font-semibold">Recent work</h2>{[...jobs].sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt)).slice(0,3).map(job=><div key={job.id} className="rounded-[14px] bg-input"><p className="break-words px-4 pt-4">{job.title} · {job.date}</p><MaintenanceRecord job={job} /></div>)}</div>}{bike.modelReferenceUrl ? <Link className="block min-h-11 py-3 text-link" href={bike.modelReferenceUrl}>Model reference</Link> : <p className="text-muted-foreground">Reference unavailable until a supported model and year are confirmed.</p>}{bike.motorcycleId && <Link className="block min-h-11 py-3 text-link" href={`/diagnose?bike=${bike.motorcycleId}`}>Diagnostic guides</Link>}</>}
      <div hidden={tab !== 'maintenance'} className="space-y-4"><h2 className="text-[22px] font-semibold">Maintenance</h2><Button className="min-h-11 whitespace-nowrap" disabled={busy || Boolean(bike.archivedAt)} onClick={()=>setLogging(!logging)} aria-expanded={logging}>Log maintenance</Button><div hidden={!logging}><QuickJobForm bike={bike} onReloadPrevious={async()=>{
        if(pending.current) throw new Error('Another change is still saving. Try again after it finishes.')
        const current=++generation.current
        const fresh=await loadBikeWorkspace(bike.id,owner)
        if(current!==generation.current || pending.current) throw new Error('The workspace changed. Try reloading the previous activity again.')
        setBike(fresh.bike);setJobs(fresh.jobs);setFiles(fresh.files??[])
        return previousActivity(fresh.jobs)
      }} previous={previousActivity(jobs)} onStart={(draft,carry)=>mutateJob(()=>startMaintenanceJob(draft,carry,owner),rememberJob)} disabled={busy} onSave={draft=>mutateJob(()=>saveQuickJob(draft,owner),rememberJob)} /></div><Button type="button" variant="outline" className="min-h-11" disabled={busy || Boolean(bike.archivedAt)} onClick={async()=>{try{setTemplates(await loadTemplates(bike.id,owner));setShowTemplates(true)}catch(error){setError(error instanceof Error?error.message:'Could not load templates.')}}}>Choose maintenance template</Button>{showTemplates&&<TemplatePicker bike={bike} templates={templates} previous={previousActivity(jobs)} disabled={busy || Boolean(bike.archivedAt)} coverage={reviewedTemplates.filter(entry=>entry.verification==='verified'&&entry.template.motorcycleId===bike.motorcycleId).map(entry=>entry.template)} onConfirmCoverage={()=>setTab('details')} onReloadTemplates={async()=>{setTemplates(await loadTemplates(bike.id,owner))}} onSave={async template=>{const result=await savePersonalTemplate(template,owner);setTemplates(current=>[...current.filter(t=>t.id!==result.id),result]);return result}} onReloadPrevious={async()=>{const fresh=await loadBikeWorkspace(bike.id,owner);setBike(fresh.bike);setJobs(fresh.jobs);return previousActivity(fresh.jobs)}} onStart={(draft,ids,carry)=>mutateJob(()=>startTemplateMaintenance(draft,ids,carry,owner),rememberJob)} />}<MaintenanceHistory onReload={id=>loadMaintenanceJob(id,bike.id,owner)} bikeId={bike.id} files={files} onFilesChanged={()=>void reconcile().catch(()=>setError('File saved. Refresh to load the latest photos and receipts.'))} jobs={jobs} disabled={busy} onEdit={(id,revision,details)=>mutateJob(()=>correctJob(id,bike.id,revision,details,owner),rememberJob)} onDelete={id=>mutateJob(()=>removeJob(id,bike.id,true,owner),()=>setJobs(current=>current.filter(job=>job.id!==id)))} /></div>
      <div hidden={tab !== 'details'} className="space-y-4"><h2 className="text-[22px] font-semibold">Bike details</h2><BikeForm models={models} initial={bike} disabled={busy} onSave={save} /><div className="flex flex-wrap gap-3 border-t border-separator pt-5"><Button variant="outline" disabled={busy} onClick={() => void archive()}>{bike.archivedAt ? 'Restore bike' : 'Archive bike'}</Button><Button ref={remove} variant="outline" disabled={busy} onClick={() => setConfirm(true)}>Remove bike</Button></div></div>
      {error && <p role="alert">{error}</p>}
    </section>
    {confirm && <div role="alertdialog" aria-modal="true" aria-labelledby="remove-title" aria-describedby="remove-description" className="fixed inset-0 z-[60] flex items-center justify-center bg-background/90 p-5" onKeyDown={event => {
      if (event.key === 'Escape' && !busy) { setConfirm(false); remove.current?.focus() }
      if (event.key === 'Tab') { event.preventDefault(); const buttons = event.currentTarget.querySelectorAll('button'); const next = document.activeElement === buttons[0] ? buttons[1] : buttons[0]; (next as HTMLButtonElement)?.focus() }
    }}><div className="max-w-sm space-y-4 rounded-[20px] bg-card p-5 shadow-card"><h2 id="remove-title" className="text-[22px] font-semibold">Remove this bike?</h2><p id="remove-description">This permanently removes the bike. Archive it to keep its history.</p><div className="flex flex-wrap gap-3"><Button ref={cancel} variant="outline" disabled={busy} onClick={() => { setConfirm(false); remove.current?.focus() }}>Cancel removal</Button><Button disabled={busy} onClick={() => void removeConfirmed()}>Confirm removal</Button></div>{error && <p role="alert">{error}</p>}</div></div>}
  </div>
}
