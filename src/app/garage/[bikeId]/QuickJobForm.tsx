'use client'
import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SegmentedControl } from '@/components/ui/segmented-control'
import type { BikeView } from '@/lib/garageBikes'
import type { JobDraft, JobView, SavedResult } from '@/lib/maintenance/types'
import { toKilometres } from '@/lib/maintenance/distance'
import { parseCost, parseJobDetails, type JobDetails } from '@/lib/maintenance/validation'

import { CarryOverPicker } from './CarryOverPicker'
import type { CarrySelection } from '@/lib/maintenance/carryover'

export type Fields = { title:string; date:string; mileage:string; notes:string; parts:string; performer:string; cost:string; currency:string }
export function fields(job?: JobView): Fields {
  const now = new Date()
  return {title:job?.title ?? '',date:job?.date ?? `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`,mileage:job?.mileageKm.toString() ?? '',notes:job?.notes ?? '',parts:job?.parts ?? '',performer:job?.performer ?? '',cost:job?.costMinor == null ? '' : `${Math.floor(job.costMinor/100)}.${String(job.costMinor%100).padStart(2,'0')}`,currency:job?.currency ?? 'EUR'}
}
export function QuickJobForm({bike,onSave,onStart,onReloadPrevious,previous=null,disabled=false}:{bike:BikeView;onSave:(draft:JobDraft)=>Promise<SavedResult<JobView>>;onStart?:(draft:JobDraft,carry:CarrySelection)=>Promise<SavedResult<JobView>>;previous?:JobView|null;onReloadPrevious?:()=>Promise<JobView|null>;disabled?:boolean}) {
  const [carry,setCarry]=useState<CarrySelection|null>(null)
  const [selectedPrevious,setSelectedPrevious]=useState<JobView|null>(null)
  const [reviewedPrevious,setReviewedPrevious]=useState<JobView|null|undefined>(undefined)
  const [sourceConflict,setSourceConflict]=useState(false)
  const offeredPrevious=selectedPrevious??(reviewedPrevious===undefined?previous:reviewedPrevious)
  const [pickerVersion,setPickerVersion]=useState(0)
  const [ids,setIds]=useState(()=>({job:crypto.randomUUID(),task:crypto.randomUUID(),doneAt:new Date().toISOString()}))
  return <JobDetailsForm onReloadPrevious={sourceConflict && onReloadPrevious?async()=>{
    const fresh=await onReloadPrevious()
    setCarry(null);setSelectedPrevious(null);setReviewedPrevious(fresh);setPickerVersion(value=>value+1);setSourceConflict(false)
  }:undefined} extra={onStart && <>{reviewedPrevious!==undefined && <p role="status">{reviewedPrevious?`Previous activity reloaded: ${reviewedPrevious.title}.`:'No previous activity is available.'} Carry choices were cleared. Select work again if needed.</p>}<CarryOverPicker key={pickerVersion} previous={offeredPrevious} onChange={choice=>{setCarry(choice);setSelectedPrevious(choice?offeredPrevious:null)}} /></>} disabled={disabled || Boolean(bike.archivedAt)} onSave={async details=>{
    const draft:JobDraft={...details,id:ids.job,bikeId:bike.id,template:null,tasks:[{id:ids.task,key:null,label:details.title,action:'other',state:'done',reason:'',notes:'',doneAt:ids.doneAt,origin:null,reference:null,warning:null,specification:null,safety:null}]}
    const result=await (carry && onStart?onStart(draft,carry):onSave(draft))
    if(!result.ok && carry && result.error==='conflict') setSourceConflict(true)
    if(result.ok) {setSourceConflict(false);setReviewedPrevious(undefined);setIds({job:crypto.randomUUID(),task:crypto.randomUUID(),doneAt:new Date().toISOString()});setCarry(null);setSelectedPrevious(null);setPickerVersion(value=>value+1)}
    return result
  }} />
}
export type JobDetailsFormDraft = {input:Fields;unit:'km'|'miles';expanded:boolean}
/** Corrections change details only; task state and completion facts remain intact. */
export function JobDetailsForm({job,onSave,disabled=false,onCancel,draft,onDraftChange,extra,onReloadPrevious}:{job?:JobView;onSave:(details:JobDetails)=>Promise<SavedResult<JobView>>;disabled?:boolean;onCancel?:()=>void;draft?:JobDetailsFormDraft;onDraftChange?:(draft:JobDetailsFormDraft)=>void;extra?:ReactNode;onReloadPrevious?:()=>Promise<void>}) {
  const [localInput,setInput]=useState(()=>fields(job))
  const [localUnit,setUnit]=useState<'km'|'miles'>('km')
  const [localExpanded,setExpanded]=useState(false)
  const input=draft?.input??localInput,unit=draft?.unit??localUnit,expanded=draft?.expanded??localExpanded
  function update(next:JobDetailsFormDraft) {if(onDraftChange)onDraftChange(next);else {setInput(next.input);setUnit(next.unit);setExpanded(next.expanded)}}
  const [confirm,setConfirm]=useState(false)
  const [busy,setBusy]=useState(false)
  const [reloading,setReloading]=useState(false)
  const [error,setError]=useState('')
  const [saved,setSaved]=useState(false)
  const pending=useRef(false)
  const prepared=useRef<JobDetails | null>(null)
  const prefix=job ? `edit-${job.id}` : 'quick-job'
  function change(field:keyof Fields,value:string) {update({input:{...input,[field]:value},unit,expanded});setSaved(false);setConfirm(false)}
  async function persist(details:JobDetails) {
    if(pending.current || disabled) return
    pending.current=true;setBusy(true);setError('');setSaved(false)
    try {
      const result=await onSave(details)
      if(!result.ok) {setError(result.message);return}
      setConfirm(false);setSaved(true)
      if(!job) {setInput(fields());setUnit('km')}
    } catch(error) {setError(error instanceof Error ? error.message : 'Could not save. Try again.')}
    finally {pending.current=false;setBusy(false)}
  }
  async function reloadPrevious() {
    if(pending.current || disabled || !onReloadPrevious) return
    pending.current=true;setBusy(true);setReloading(true)
    try {await onReloadPrevious();setError('')}
    catch(error) {setError(error instanceof Error?error.message:'Could not reload the previous activity. Try again.')}
    finally {pending.current=false;setBusy(false);setReloading(false)}
  }
  function submit(event:FormEvent) {
    event.preventDefault()
    if(pending.current || disabled) return
    try {
      if(input.mileage.trim()==='') throw new Error('Enter the job mileage.')
      const details=parseJobDetails({title:input.title,date:input.date,mileageKm:toKilometres(Number(input.mileage),unit),notes:input.notes,parts:input.parts,performer:input.performer,...parseCost(input.cost,input.currency)})
      if(job) {prepared.current=details;setConfirm(true);setError('')} else void persist(details)
    } catch {setError('Check the date, mileage, work and cost. Cost needs at most two decimal places.')}
  }
  function field(key:keyof Fields,label:string,required=false,type='text',maxLength?:number) {
    return <div className="space-y-2"><label htmlFor={`${prefix}-${key}`}>{label}</label><Input id={`${prefix}-${key}`} className="min-h-11" type={type} required={required} maxLength={maxLength} value={input[key]} onChange={event=>change(key,event.target.value)} /></div>
  }
  return <form onSubmit={submit} className="space-y-4"><fieldset disabled={busy || disabled} className="space-y-4">
    {field('date','Job date',true,'date')}
    {field('mileage','Job mileage',true)}
    <SegmentedControl aria-label="Job mileage unit" className="[&_button]:min-h-11 [&_button]:whitespace-nowrap" value={unit} onChange={next=>{if(next===unit)return;update({input:{...input,mileage:input.mileage.trim()!=='' && Number.isFinite(Number(input.mileage))?String(Number(input.mileage)*(next==='miles'?1/1.609344:1.609344)):input.mileage},unit:next,expanded});setSaved(false);setConfirm(false)}} options={[{value:'km',label:'Kilometres'},{value:'miles',label:'Miles'}]} />
    {field('title','Work performed',true,'text',160)}
    <Button variant="outline" type="button" className="min-h-11 whitespace-nowrap" aria-expanded={expanded} onClick={()=>update({input,unit,expanded:!expanded})}>Optional details</Button>
    {expanded && <div className="space-y-4 rounded-[14px] bg-input p-4">{(['notes','parts'] as const).map(key=><div key={key} className="space-y-2"><label htmlFor={`${prefix}-${key}`}>{key==='notes'?'Notes':'Parts'}</label><textarea id={`${prefix}-${key}`} className="min-h-24 w-full rounded-[10px] bg-background p-3" maxLength={4000} value={input[key]} onChange={event=>change(key,event.target.value)} /></div>)}{field('performer','Performed by',false,'text',120)}{field('cost','Cost')}<label htmlFor={`${prefix}-currency`}>Currency</label><select id={`${prefix}-currency`} className="min-h-11 rounded-[10px] bg-background px-3" value={input.currency} onChange={event=>change('currency',event.target.value)}>{['EUR','GBP','USD'].map(currency=><option key={currency}>{currency}</option>)}</select><p className="text-muted-foreground">Cost is optional. Leave blank if unknown; zero means no cost.</p></div>}
    {extra}
    {error && <><p role="alert">{error}</p>{onReloadPrevious && <Button type="button" variant="outline" className="min-h-11 whitespace-nowrap" onClick={()=>void reloadPrevious()}>Reload previous activity</Button>}</>}{saved && <p role="status">Entry saved.</p>}
    <div className="flex flex-wrap gap-3"><Button className="min-h-11 whitespace-nowrap" type="submit" disabled={busy || disabled}>{reloading?'Refreshing…':busy?'Saving…':job?'Save correction':'Save entry'}</Button>{onCancel && <Button variant="outline" type="button" className="min-h-11 whitespace-nowrap" onClick={onCancel}>Cancel edit</Button>}</div>
    {confirm && <div role="group" aria-label="Confirm record correction" className="space-y-3 rounded-[14px] bg-input p-4"><p>Save these corrections to this record? Task states and completion dates stay as recorded.</p><Button className="min-h-11 whitespace-nowrap" type="button" onClick={()=>prepared.current && void persist(prepared.current)}>Confirm correction</Button><Button className="min-h-11 whitespace-nowrap" variant="outline" type="button" onClick={()=>setConfirm(false)}>Keep editing</Button></div>}
  </fieldset></form>
}
