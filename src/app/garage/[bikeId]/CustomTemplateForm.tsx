'use client'
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Template, TemplateTask } from '@/lib/maintenance/types'
import { validateTemplate, rekeyChangedTasks } from '@/lib/maintenance/templateValidation'
export function CustomTemplateForm({initial,onSave,onCancel}:{initial?:Template;onSave:(template:Template)=>Promise<Template>;onCancel:()=>void}) {
 const [id]=useState(()=>initial?.id??crypto.randomUUID())
 const [title,setTitle]=useState(initial?.title??'')
 const blank=():TemplateTask=>({key:`custom:${id}:${crypto.randomUUID()}`,label:'',action:'other',reference:null,warning:null,specification:null,safety:null})
 const [tasks,setTasks]=useState<TemplateTask[]>(()=>initial?.tasks.map(task=>({...task}))??[blank()])
 const [error,setError]=useState(''),[busy,setBusy]=useState(false)
 const pending=useRef(false)
 return <form className="space-y-4" onSubmit={async event=>{
  event.preventDefault();if(pending.current)return;pending.current=true;setBusy(true);setError('')
  try {const definitions=rekeyChangedTasks(initial?.tasks??[],tasks,()=>`custom:${id}:${crypto.randomUUID()}`);setTasks(definitions);await onSave(validateTemplate({id,version:initial?.version??1,title,kind:'custom',motorcycleId:null,years:[],markets:[],variants:[],intervalKm:null,intervalMonths:null,frequency:'on_demand',source:null,tasks:definitions}));onCancel()}
  catch(error){setError(error instanceof Error?error.message:'Could not save template. Try again.')}
  finally{pending.current=false;setBusy(false)}
 }}><fieldset disabled={busy} className="space-y-3"><label className="block">Template title<Input className="min-h-11" required maxLength={160} value={title} onChange={event=>setTitle(event.target.value)} /></label><p>Personal checklist. Safety guidance is unassessed. Only task definitions are saved.</p>{tasks.map((task,index)=><div key={task.key} className="space-y-2 rounded-[14px] bg-input p-3"><label className="block">Task {index+1}<Input className="min-h-11" required maxLength={160} value={task.label} onChange={event=>setTasks(tasks.map((t,i)=>i===index?{...t,label:event.target.value}:t))} /></label><label className="block">Action {index+1}<select className="min-h-11 w-full bg-background px-3" value={task.action} onChange={event=>setTasks(tasks.map((t,i)=>i===index?{...t,action:event.target.value as TemplateTask['action']}:t))}>{['inspect','clean','adjust','replace','other'].map(action=><option key={action}>{action}</option>)}</select></label>{tasks.length>1&&<Button type="button" variant="outline" className="min-h-11" onClick={()=>setTasks(tasks.filter((_,i)=>i!==index))}>Remove task {index+1}</Button>}</div>)}<div className="flex flex-wrap gap-3"><Button type="button" variant="outline" className="min-h-11" disabled={tasks.length>=100} onClick={()=>setTasks([...tasks,blank()])}>Add task</Button><Button type="submit" className="min-h-11">{busy?'Saving…':'Save template'}</Button><Button type="button" variant="outline" className="min-h-11" onClick={onCancel}>Cancel template</Button></div>{error&&<p role="alert">{error}</p>}</fieldset></form>
}
