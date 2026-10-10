'use client'
import { useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SegmentedControl } from '@/components/ui/segmented-control'
import type { BikeView } from '@/lib/garageBikes'
import type { JobDraft, JobView, SavedResult } from '@/lib/maintenance/types'
import { toKilometres } from '@/lib/maintenance/distance'
import { parseCost, parseJobDetails, type JobDetails } from '@/lib/maintenance/validation'

type Fields = { title:string; date:string; mileage:string; notes:string; parts:string; performer:string; cost:string; currency:string }
function fields(job?: JobView): Fields {
  const now = new Date()
  return {title:job?.title ?? '',date:job?.date ?? `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`,mileage:job?.mileageKm.toString() ?? '',notes:job?.notes ?? '',parts:job?.parts ?? '',performer:job?.performer ?? '',cost:job?.costMinor == null ? '' : `${Math.floor(job.costMinor/100)}.${String(job.costMinor%100).padStart(2,'0')}`,currency:job?.currency ?? 'EUR'}
}
export function QuickJobForm({bike,onSave,disabled=false}:{bike:BikeView;onSave:(draft:JobDraft)=>Promise<SavedResult<JobView>>;disabled?:boolean}) {
  const [ids,setIds]=useState(()=>({job:crypto.randomUUID(),task:crypto.randomUUID(),doneAt:new Date().toISOString()}))
  return <JobDetailsForm disabled={disabled || Boolean(bike.archivedAt)} onSave={async details=>{
    const result=await onSave({...details,id:ids.job,bikeId:bike.id,template:null,tasks:[{id:ids.task,key:null,label:details.title,action:'other',state:'done',reason:'',notes:'',doneAt:ids.doneAt,origin:null,reference:null,warning:null,specification:null,safety:null}]})
    if(result.ok) setIds({job:crypto.randomUUID(),task:crypto.randomUUID(),doneAt:new Date().toISOString()})
    return result
  }} />
}
/** Corrections change details only; task state and completion facts remain intact. */
export function JobDetailsForm({job,onSave,disabled=false,onCancel}:{job?:JobView;onSave:(details:JobDetails)=>Promise<SavedResult<JobView>>;disabled?:boolean;onCancel?:()=>void}) {
  const [input,setInput]=useState(()=>fields(job))
  const [unit,setUnit]=useState<'km'|'miles'>('km')
  const [expanded,setExpanded]=useState(false)
  const [confirm,setConfirm]=useState(false)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [saved,setSaved]=useState(false)
  const pending=useRef(false)
  const prepared=useRef<JobDetails | null>(null)
  const prefix=job ? `edit-${job.id}` : 'quick-job'
  function change(field:keyof Fields,value:string) {setInput(current=>({...current,[field]:value}));setSaved(false);setConfirm(false)}
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
    <SegmentedControl aria-label="Job mileage unit" className="[&_button]:min-h-11 [&_button]:whitespace-nowrap" value={unit} onChange={next=>{if(next===unit) return;if(input.mileage.trim()!=='' && Number.isFinite(Number(input.mileage))) change('mileage',String(Number(input.mileage)*(next==='miles'?1/1.609344:1.609344)));setUnit(next)}} options={[{value:'km',label:'Kilometres'},{value:'miles',label:'Miles'}]} />
    {field('title','Work performed',true,'text',160)}
    <Button variant="outline" type="button" className="min-h-11 whitespace-nowrap" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>Optional details</Button>
    {expanded && <div className="space-y-4 rounded-[14px] bg-input p-4">{(['notes','parts'] as const).map(key=><div key={key} className="space-y-2"><label htmlFor={`${prefix}-${key}`}>{key==='notes'?'Notes':'Parts'}</label><textarea id={`${prefix}-${key}`} className="min-h-24 w-full rounded-[10px] bg-background p-3" maxLength={4000} value={input[key]} onChange={event=>change(key,event.target.value)} /></div>)}{field('performer','Performed by',false,'text',120)}{field('cost','Cost')}<label htmlFor={`${prefix}-currency`}>Currency</label><select id={`${prefix}-currency`} className="min-h-11 rounded-[10px] bg-background px-3" value={input.currency} onChange={event=>change('currency',event.target.value)}>{['EUR','GBP','USD'].map(currency=><option key={currency}>{currency}</option>)}</select><p className="text-muted-foreground">Cost is optional. Leave blank if unknown; zero means no cost.</p></div>}
    {error && <p role="alert">{error}</p>}{saved && <p role="status">Entry saved.</p>}
    <div className="flex flex-wrap gap-3"><Button className="min-h-11 whitespace-nowrap" type="submit" disabled={busy || disabled}>{busy?'Saving…':job?'Save correction':'Save entry'}</Button>{onCancel && <Button variant="outline" type="button" className="min-h-11 whitespace-nowrap" onClick={onCancel}>Cancel edit</Button>}</div>
    {confirm && <div role="group" aria-label="Confirm record correction" className="space-y-3 rounded-[14px] bg-input p-4"><p>Save these corrections to this record? Task states and completion dates stay as recorded.</p><Button className="min-h-11 whitespace-nowrap" type="button" onClick={()=>prepared.current && void persist(prepared.current)}>Confirm correction</Button><Button className="min-h-11 whitespace-nowrap" variant="outline" type="button" onClick={()=>setConfirm(false)}>Keep editing</Button></div>}
  </fieldset></form>
}
