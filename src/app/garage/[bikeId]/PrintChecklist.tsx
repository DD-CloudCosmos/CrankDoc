'use client'
import type { BikeView } from '@/lib/garageBikes'
import type { JobTask, JobView, Template } from '@/lib/maintenance/types'
import { taskStateLabels } from './ChecklistRow'
function Sheet({bike,title,template,tasks,job}:{bike:BikeView;title:string;template:Template|null;tasks:JobTask[];job?:JobView}) {
 return <section className="garage-print-sheet space-y-5">
  <button type="button" className="garage-print-action min-h-11 rounded-[10px] bg-primary px-5 text-primary-foreground" onClick={()=>window.print()}>Print</button>
  <header className="space-y-2"><h1 className="print-text text-3xl font-semibold">{title}</h1><p className="print-text">{bike.nickname || `${bike.make} ${bike.model}`} · {bike.make} {bike.model}{bike.year?` · ${bike.year}`:''}{bike.variant?` · ${bike.variant}`:''}{bike.market?` · ${bike.market}`:''}</p>
   {template?<><p>Version {template.version} · {template.kind==='custom'?'Personal template':job?'Saved template snapshot':'Reviewed service template'}</p><p className="print-text">Source: {template.source || 'Personal template; safety guidance unassessed.'}</p></>:<p>Quick maintenance entry; no template source.</p>}
   {job?<><p>Date: {job.date} · Mileage: {job.mileageKm.toLocaleString('en-GB')} km</p><p>{job.status==='in_progress'?'In progress':job.status==='partial'?'Partially completed':'Completed'}</p></>:<><p>Base-template preview. Selected additions and carry-over are not included. No activity has been created.</p><p aria-label="Blank date">Date: ____________________</p><p aria-label="Blank mileage">Mileage: ____________________ km</p></>}
  </header>
  {job?.notes&&<div><h2 className="font-semibold">Job notes</h2><p className="print-text">{job.notes}</p></div>}
  {tasks.map(task=><article key={task.id} className={`print-task ${task.label.length+task.reason.length+(task.warning?.length??0)+task.notes.length+(task.origin?.previousNotes.length??0)+(task.reference?.length??0)+(task.specification?.length??0)>1000?'print-task-long':''} space-y-2 border-t border-border pt-4`}>
   <h2 className="print-text text-lg font-semibold"><span aria-hidden="true">{task.state==='done'?'☑':'☐'} </span>{task.label}</h2><p>{taskStateLabels[task.state]}</p>{task.action!=='other' && <p>Action: {task.action}</p>}
   {task.reason&&<p className="print-text">Reason: {task.reason}</p>}
   {task.doneAt&&<p>Completed: {task.doneAt}</p>}
   {task.warning&&<p className="print-text"><strong>Warning: </strong>{task.warning}</p>}
   {!task.safety&&<p>Unassessed: safety guidance has not been reviewed.</p>}
   {(!task.reference||!task.specification)&&<p>Unassessed: procedure or specification guidance is missing.</p>}
   {task.reference&&<p className="print-text">{task.reference}</p>}{task.specification&&<p className="print-text">{task.specification}</p>}
   {task.notes&&<div><h3 className="font-semibold">Notes</h3><p className="print-text">{task.notes}</p></div>}
   {task.origin&&<div><h3 className="font-semibold">Previous activity notes</h3><p className="print-text">{task.origin.previousNotes || 'No previous observations recorded.'}</p><p className="print-text">Original activity: {task.origin.jobId}; task: {task.origin.taskId}</p></div>}
   <div aria-label={`Writing space: ${task.label}`} className="print-writing-space border-b border-border">Notes: <br /><br /></div>
  </article>)}
 </section>
}
export function PrintChecklist({bike,job}:{bike:BikeView;job:JobView}) {return <Sheet bike={bike} title={job.title} template={job.template} tasks={job.tasks} job={job} />}
export function BlankPrintChecklist({bike,template}:{bike:BikeView;template:Template}) {
 const tasks=template.tasks.map((task,index)=>({...task,id:String(index),state:'todo' as const,reason:'',notes:'',doneAt:null,origin:null}))
 return <Sheet bike={bike} title={template.title} template={template} tasks={tasks} />
}
