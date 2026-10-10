'use client'
import { useState } from 'react'
import { SafetyBadge } from '@/components/SafetyBadge'
import { Button } from '@/components/ui/button'
import type { JobTask, TaskPatch, TaskState } from '@/lib/maintenance/types'
export const taskStateLabels:Record<TaskState,string>={todo:'To do',done:'Done',skipped:'Skipped',not_applicable:'Not applicable'}
export function ChecklistRow({task,onChange}:{task:JobTask;onChange:(patch:TaskPatch)=>void}) {
 const [choice,setChoice]=useState<TaskState|null>(null)
 const [reason,setReason]=useState('')
 const [error,setError]=useState('')
 function apply() {
  if(!choice)return
  if(!reason.trim()) {setError('Explain why this task is skipped or not applicable.');return}
  onChange({state:choice,reason:reason.trim()});setChoice(null);setError('')
 }
 return <article className="space-y-3 break-words rounded-[16px] bg-card p-4 shadow-card">
  <div className="flex items-start gap-3"><input id={`done-${task.id}`} type="checkbox" className="min-h-11 min-w-11 shrink-0 accent-primary" aria-label={task.label} checked={task.state==='done'} onChange={event=>{setChoice(null);onChange({state:event.target.checked?'done':'todo',reason:''})}} /><label htmlFor={`done-${task.id}`} className="min-h-11 py-2 text-lg font-semibold">{task.label}</label></div>
  <p>{taskStateLabels[task.state]}</p>
  {task.safety?<SafetyBadge level={task.safety} />:<p className="text-muted-foreground">Unassessed: safety guidance has not been reviewed.</p>}
  {(!task.reference || !task.specification) && <p className="text-muted-foreground">Unassessed: procedure or specification guidance is missing.</p>}
  {task.warning && <p className="rounded-[10px] bg-caution-background p-3 text-caution-foreground"><strong>Warning: </strong>{task.warning}</p>}
  {task.reason && <p className="whitespace-pre-wrap">Reason: {task.reason}</p>}
  <label className="block" htmlFor={`state-${task.id}`}>Task state: {task.label}</label>
  <select id={`state-${task.id}`} className="min-h-11 max-w-full rounded-[10px] bg-input px-3" value={choice??task.state} onChange={event=>{
   const state=event.target.value as TaskState
   if(state==='skipped' || state==='not_applicable') {setChoice(state);setReason(task.reason);setError('')}
   else {setChoice(null);onChange({state,reason:''})}
  }}>{Object.entries(taskStateLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
  {choice && <div className="space-y-3"><label className="block" htmlFor={`reason-${task.id}`}>Reason: {task.label}</label><textarea id={`reason-${task.id}`} className="min-h-24 w-full rounded-[10px] bg-input p-3" maxLength={500} value={reason} onChange={event=>setReason(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error?`reason-error-${task.id}`:undefined} />{error && <p id={`reason-error-${task.id}`} role="alert">{error}</p>}<div className="flex flex-wrap gap-3"><Button className="min-h-11 whitespace-nowrap" onClick={apply}>Apply state</Button><Button variant="outline" className="min-h-11" onClick={()=>{setChoice(null);setError('')}}>Cancel state change</Button></div></div>}
  <details><summary className="min-h-11 cursor-pointer py-3 text-link focus-visible:outline-ring">Notes and reference</summary><div className="space-y-3"><label className="block" htmlFor={`notes-${task.id}`}>Notes: {task.label}</label><textarea id={`notes-${task.id}`} className="min-h-24 w-full rounded-[10px] bg-input p-3" maxLength={4000} value={task.notes} onChange={event=>onChange({notes:event.target.value})} />{task.reference && <p className="whitespace-pre-wrap">{task.reference}</p>}{task.specification && <p className="whitespace-pre-wrap">{task.specification}</p>}{task.origin && <div><p className="font-semibold">Previous activity notes</p><p className="whitespace-pre-wrap">{task.origin.previousNotes || 'No previous observations recorded.'}</p></div>}</div></details>
 </article>
}
