'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useChecklist } from '@/hooks/useChecklist'
import type { JobView } from '@/lib/maintenance/types'
import { ChecklistRow, taskStateLabels } from './ChecklistRow'
import { JobDetailsForm } from './QuickJobForm'
export function Checklist({initialJob}:{initialJob:JobView}) {
 const {job,dirty,saving,error,conflict,setTask,retry,reload,complete,correct}=useChecklist(initialJob)
 const [summary,setSummary]=useState(false)
 const [date,setDate]=useState(initialJob.date)
 const [mileage,setMileage]=useState(String(initialJob.mileageKm))
 const [formError,setFormError]=useState('')
 const [editing,setEditing]=useState(false)
 async function finish() {
  setFormError('')
  if(!date || !mileage.trim() || !Number.isFinite(Number(mileage)) || Number(mileage)<0) {setFormError('Enter a valid completion date and mileage.');return}
  try {const result=await complete(date,Number(mileage));if(result.ok)setSummary(false);else setFormError(result.message)}catch(error){setFormError(error instanceof Error?error.message:'Could not complete the job.')}
 }
 return <div className="space-y-5">
  <h1 className="break-words text-[34px] font-semibold">{job.title}</h1>
  <p>{job.date} · {job.mileageKm.toLocaleString()} km</p>
  <p>{job.tasks.filter(task=>task.state==='done').length} of {job.tasks.length} Done</p>
  <p role="status" aria-live="polite">{saving?'Saving…':error?'Changes not saved':dirty?'Unsaved changes':'Saved'}</p>
  {error && <div role="alert" className="space-y-3"><p>{error}</p><p>Your unsaved notes remain in the fields below and can be selected and copied.</p>{/sign in/i.test(error)?<a className="inline-block min-h-11 py-3 text-link" href="/account?next=/garage" target="_blank">Sign in again, then return to this tab</a>:null}{conflict?<Button className="min-h-11" variant="outline" disabled={saving} onClick={()=>void reload().catch(error=>setFormError(error instanceof Error?error.message:'Could not reload.'))}>Reload saved version</Button>:<Button className="min-h-11" disabled={saving} onClick={()=>void retry()}>Retry save</Button>}</div>}
  {job.tasks.map(task=><ChecklistRow key={task.id} task={task} onChange={patch=>setTask(task.id,patch)} />)}
  {job.status==='in_progress'?<Button className="min-h-11 whitespace-nowrap" disabled={dirty || saving} onClick={()=>{setDate(job.date);setMileage(String(job.mileageKm));setSummary(true)}}>Finish job</Button>:<div className="space-y-3"><p>{job.status==='partial'?'Job partially completed':'Job completed'}</p><p>This job is recorded in the bike’s maintenance history.</p>{editing?<JobDetailsForm job={job} disabled={dirty || saving} onCancel={()=>setEditing(false)} onSave={async details=>{const result=await correct(details);if(result.ok)setEditing(false);return result}} />:<Button className="min-h-11" variant="outline" disabled={dirty || saving} onClick={()=>setEditing(true)}>Edit recorded date and mileage</Button>}</div>}
  {summary && job.status==='in_progress' && <div role="group" aria-label="Completion summary" className="space-y-3 rounded-[16px] bg-card p-4 shadow-card"><h2 className="text-[22px] font-semibold">Complete this job?</h2><p>Outstanding tasks keep their recorded states and notes. To do or Skipped work means partial completion.</p>{job.tasks.filter(task=>task.state!=='done').map(task=><p key={task.id}>{task.label}: {taskStateLabels[task.state]}{task.reason?` (${task.reason})`:''}</p>)}<label className="block" htmlFor="completion-date">Completion date</label><input id="completion-date" type="date" className="min-h-11 max-w-full rounded-[10px] bg-input p-3" value={date} onChange={event=>setDate(event.target.value)} /><label className="block" htmlFor="completion-mileage">Completion mileage (km)</label><input id="completion-mileage" type="number" min="0" step="0.001" className="min-h-11 w-full rounded-[10px] bg-input p-3" value={mileage} onChange={event=>setMileage(event.target.value)} /><div className="flex flex-wrap gap-3"><Button className="min-h-11 whitespace-nowrap" disabled={dirty || saving} onClick={()=>void finish()}>Confirm completion</Button><Button className="min-h-11" variant="outline" disabled={saving} onClick={()=>setSummary(false)}>Cancel completion</Button></div></div>}
  {formError && (job.status==='in_progress' || editing) && <p role="alert">{formError}</p>}
 </div>
}
