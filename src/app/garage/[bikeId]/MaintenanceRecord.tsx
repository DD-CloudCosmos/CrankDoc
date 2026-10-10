'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useGarageOwner } from '../PrivateGarage'
import { savePersonalTemplate } from '../actions'
import { templateFromJob } from '@/lib/maintenance/templates'
import { CustomTemplateForm } from './CustomTemplateForm'
import type { Template } from '@/lib/maintenance/types'
import type { JobView } from '@/lib/maintenance/types'
export function MaintenanceRecord({job}:{job:JobView}) {
 const owner=useGarageOwner()
 const [template,setTemplate]=useState<Template|null>(null)
 const [saved,setSaved]=useState(false)
 return <div className="space-y-3 break-words p-4"><p>{job.status==='in_progress'?'In progress':job.status==='partial'?'Partial':'Completed'}</p>{job.tasks.map(task=><div key={task.id}><p>{task.label} · {task.state.replaceAll('_',' ')}</p>{task.action!=='other' && <p>Action: {task.action}</p>}{task.notes && <p className="whitespace-pre-wrap">{task.notes}</p>}{task.reason && <p>{task.reason}</p>}</div>)}{job.notes && <p className="whitespace-pre-wrap">{job.notes}</p>}{job.parts && <p className="whitespace-pre-wrap">Parts: {job.parts}</p>}{job.performer && <p>Performed by: {job.performer}</p>}{job.costMinor!==null && <p>Cost: {job.currency} {Math.floor(job.costMinor/100)}.{String(job.costMinor%100).padStart(2,'0')}</p>}<Button type="button" variant="outline" className="min-h-11" onClick={()=>{setTemplate(templateFromJob(job,crypto.randomUUID(),job.title));setSaved(false)}}>Save as template</Button>{template&&<CustomTemplateForm initial={template} onSave={async value=>{const result=await savePersonalTemplate(value,owner);setSaved(true);return result}} onCancel={()=>setTemplate(null)} />}{saved&&<p role="status">Personal template saved.</p>}</div>
}
