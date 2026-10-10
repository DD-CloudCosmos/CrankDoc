'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { JobView } from '@/lib/maintenance/types'
import { carryCandidates,type CarrySelection } from '@/lib/maintenance/carryover'
export function CarryOverPicker({previous,onChange}:{previous:JobView|null;onChange:(choice:CarrySelection|null)=>void}) {
 const [expanded,setExpanded]=useState(false)
 const [taskIds,setTaskIds]=useState<string[]>([])
 const [closePrevious,setClosePrevious]=useState(false)
 const candidates=carryCandidates(previous)
 if(!previous||!candidates.length) return null
 function choose(ids:string[],close:boolean) {
  setTaskIds(ids);setClosePrevious(close)
  onChange(ids.length||close?{sourceJobId:previous!.id,sourceRevision:previous!.revision,taskIds:ids,closePrevious:close}:null)
 }
 return <div className="space-y-3"><Button type="button" variant="outline" className="min-h-11 whitespace-nowrap" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>Carry unfinished work</Button>{expanded&&<div className="space-y-3 rounded-[14px] bg-input p-4"><p>{previous.title} · {previous.date}</p>{candidates.map(task=><div key={task.id}><label className="flex min-h-11 items-center gap-3"><input type="checkbox" className="h-5 w-5" checked={taskIds.includes(task.id)} onChange={event=>choose(event.target.checked?[...taskIds,task.id]:taskIds.filter(id=>id!==task.id),closePrevious)} />{task.label}</label>{task.notes&&<div className="break-words whitespace-pre-wrap text-muted-foreground"><p>Previous activity notes</p><p>{task.notes}</p></div>}</div>)}{previous.status==='in_progress'&&<label className="flex min-h-11 items-center gap-3"><input type="checkbox" className="h-5 w-5" checked={closePrevious} onChange={event=>choose(taskIds,event.target.checked)} />Complete previous activity</label>}</div>}</div>
}
