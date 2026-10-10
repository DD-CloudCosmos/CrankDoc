import type {BikeView} from '@/lib/garageBikes'
import type {JobView,TemplateTask} from './types'
export type ExportFile={id:string;jobId:string|null;kind:'bike_photo'|'receipt';filename:string}
function orderedJobs(bike:BikeView,jobs:JobView[]) {return jobs.filter(job=>job.bikeId===bike.id).sort((a,b)=>a.date.localeCompare(b.date)||a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id))}
function templateTask(task:TemplateTask) {return {key:task.key,label:task.label,action:task.action,reference:task.reference,warning:task.warning,specification:task.specification,safety:task.safety}}
export function exportBikeJson(bike:BikeView,jobs:JobView[],files:ExportFile[]):string {
 const ownedJobs=orderedJobs(bike,jobs)
 const jobIds=new Set(ownedJobs.map(job=>job.id))
 return JSON.stringify({bike:{id:bike.id,motorcycleId:bike.motorcycleId,nickname:bike.nickname,make:bike.make,model:bike.model,year:bike.year,variant:bike.variant,market:bike.market,registration:bike.registration,mileageKm:bike.mileageKm,archivedAt:bike.archivedAt},jobs:ownedJobs.map(job=>({id:job.id,bikeId:job.bikeId,title:job.title,date:job.date,mileageKm:job.mileageKm,
 template:job.template?{id:job.template.id,version:job.template.version,title:job.template.title,kind:job.template.kind,motorcycleId:job.template.motorcycleId,years:job.template.years,markets:job.template.markets,variants:job.template.variants,intervalKm:job.template.intervalKm,intervalMonths:job.template.intervalMonths,frequency:job.template.frequency,source:job.template.source,tasks:job.template.tasks.map(templateTask)}:null,
 tasks:job.tasks.map(task=>({id:task.id,...templateTask(task),state:task.state,reason:task.reason,notes:task.notes,doneAt:task.doneAt,origin:task.origin?{jobId:task.origin.jobId,taskId:task.origin.taskId,previousNotes:task.origin.previousNotes}:null})),notes:job.notes,parts:job.parts,performer:job.performer,costMinor:job.costMinor,currency:job.currency,revision:job.revision,status:job.status,closeReason:job.closeReason,closedAt:job.closedAt,createdAt:job.createdAt})),files:files.filter(file=>file.jobId===null||jobIds.has(file.jobId)).sort((a,b)=>a.id.localeCompare(b.id)).map(file=>({id:file.id,jobId:file.jobId,kind:file.kind,filename:file.filename}))},null,2)
}
function cell(value:unknown):string {
 const text=value===null||value===undefined?'':String(value)
 const safe=/^\s*[=+\-@]/u.test(text)?`'${text}`:text
 return `"${safe.replaceAll('"','""')}"`
}
export function exportBikeCsv(bike:BikeView,jobs:JobView[]):string {
 const rows:unknown[][]=[['bikeId','bike','make','model','jobId','job','date','mileageKm','status','taskId','task','action','state','reason','notes','previousNotes','jobNotes','parts','performer','costMinor','currency','doneAt','closedAt']]
 for(const job of orderedJobs(bike,jobs)) for(const task of job.tasks) rows.push([bike.id,bike.nickname||`${bike.make} ${bike.model}`,bike.make,bike.model,job.id,job.title,job.date,job.mileageKm,job.status,task.id,task.label,task.action,task.state,task.reason,task.notes,task.origin?.previousNotes,job.notes,job.parts,job.performer,job.costMinor,job.currency,task.doneAt,job.closedAt])
 return rows.map(row=>row.map(cell).join(',')).join('\r\n')
}
