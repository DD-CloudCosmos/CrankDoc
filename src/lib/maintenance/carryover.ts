import type { JobTask, JobView } from './types'
export type CarrySelection = {sourceJobId:string;sourceRevision:number;taskIds:string[];closePrevious:boolean}
export function previousActivity(jobs:JobView[]):JobView|null {
 return [...jobs].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id))[0]??null
}
export function carryCandidates(previous:JobView|null):JobTask[] {return previous?.tasks.filter(task=>task.state==='todo'||task.state==='skipped')??[]}
export function appendCarriedTasks(target:JobTask[],source:JobView,selected:string[],newId:()=>string):JobTask[] {
 const result=target.map(task=>({...task}))
 for(const task of carryCandidates(source).filter(task=>selected.includes(task.id))) {
  const origin={jobId:source.id,taskId:task.id,previousNotes:task.notes}
  const index=task.key===null?-1:result.findIndex(row=>row.key===task.key && row.origin===null)
  if(index>=0) result[index]={...result[index],state:'todo',reason:'',notes:'',doneAt:null,origin}
  else result.push({...task,id:newId(),state:'todo',reason:'',notes:'',doneAt:null,origin})
 }
 return result
}
