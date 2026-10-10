import type { JobView } from '@/lib/maintenance/types'
export function MaintenanceRecord({job}:{job:JobView}) {
 return <div className="space-y-3 break-words p-4"><p>{job.status==='in_progress'?'In progress':job.status==='partial'?'Partial':'Completed'}</p>{job.tasks.map(task=><div key={task.id}><p>{task.label} · {task.state.replaceAll('_',' ')}</p>{task.notes && <p className="whitespace-pre-wrap">{task.notes}</p>}{task.reason && <p>{task.reason}</p>}</div>)}{job.notes && <p className="whitespace-pre-wrap">{job.notes}</p>}{job.parts && <p className="whitespace-pre-wrap">Parts: {job.parts}</p>}{job.performer && <p>Performed by: {job.performer}</p>}{job.costMinor!==null && <p>Cost: {job.currency} {Math.floor(job.costMinor/100)}.{String(job.costMinor%100).padStart(2,'0')}</p>}</div>
}
