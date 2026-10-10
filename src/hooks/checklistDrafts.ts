import { saveTaskPatchAction, loadChecklistAction, closeJobAction, correctChecklistAction } from '@/app/garage/[bikeId]/jobs/[jobId]/actions'
import type { JobView, TaskPatch, SavedResult } from '@/lib/maintenance/types'
import { onGarageSignOut } from '@/lib/garageSession'
import { createAuthBrowserClient } from '@/lib/supabase/auth-browser'
import type { JobDetails } from '@/lib/maintenance/validation'

import type { JobDetailsFormDraft } from '@/app/garage/[bikeId]/QuickJobForm'
export type ReasonDraft = {choice:'skipped'|'not_applicable';reason:string}
export type ChecklistForms = {reasons:Record<string,ReasonDraft>;completion:{open:boolean;date:string;mileage:string};details:{draft:JobDetailsFormDraft;baseline:JobDetailsFormDraft}|null}
type DetailsRequest = {job:JobView;write:(job:JobView)=>Promise<SavedResult<JobView>>;matches:(job:JobView)=>boolean}
type Request = {taskId:string;patch:TaskPatch;revision:number}
export type ChecklistSnapshot = {job:JobView;dirty:boolean;saving:boolean;error:string|null;conflict:boolean;queueDirty:boolean;forms:ChecklistForms}
const drafts = new Map<string, ChecklistDraft>()
export function clearChecklistDrafts(owner:string) {
 for(const [key,draft] of drafts) if(draft.owner===owner) {draft.dispose();drafts.delete(key)}
}
export function checklistDraft(owner:string,initial:JobView) {
 // Server rendering must never retain private jobs in a shared process cache.
 if(typeof window==='undefined')return new ChecklistDraft(owner,initial)
 const key=`${owner}:${initial.id}`
 let draft=drafts.get(key)
 if(!draft) {draft=new ChecklistDraft(owner,initial);drafts.set(key,draft)}
 else draft.receive(initial)
 return draft
}

/** A private, in-memory queue survives route remounts; one revision is used at a time. */
class ChecklistDraft {
 readonly owner:string
 private saved:JobView
 private pending=new Map<string,TaskPatch>()
 private failed:Request|null=null
 private failedDetails:DetailsRequest|null=null
 private inFlight:Request|null=null
 private inFlightDetails:DetailsRequest|null=null
 private stopLogout:(()=>void)|null=null
 private suspended=false
 private timer:ReturnType<typeof setTimeout>|null=null
 private listeners=new Set<()=>void>()
 private active=true
 private authSubscription:{unsubscribe:()=>void}|null=null
 private generation=0
 private edits=0
 snapshot:ChecklistSnapshot
 constructor(owner:string,job:JobView) {this.owner=owner;this.saved=job;this.snapshot={job,dirty:false,queueDirty:false,saving:false,error:null,conflict:false,forms:{reasons:{},completion:{open:false,date:job.date,mileage:String(job.mileageKm)},details:null}}}
 subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener)}}
 getSnapshot=()=>this.snapshot
 private publish(extra:Partial<ChecklistSnapshot>={}) {
  if(!this.active)return
  let job=this.saved
  for(const [id,patch] of this.pending) job={...job,tasks:job.tasks.map(task=>task.id===id?{...task,...patch}:task)}
  const forms=extra.forms??this.snapshot.forms
  const queueDirty=this.pending.size>0 || this.failed!==null || this.failedDetails!==null
  const formDirty=Object.keys(forms.reasons).length>0 || forms.completion.open && (forms.completion.date!==this.saved.date || forms.completion.mileage!==String(this.saved.mileageKm)) || forms.details!==null && (JSON.stringify(forms.details.draft.input)!==JSON.stringify(forms.details.baseline.input) || forms.details.draft.unit!==forms.details.baseline.unit)
  this.snapshot={...this.snapshot,...extra,job,forms,queueDirty,dirty:queueDirty || formDirty}
  this.listeners.forEach(listener=>listener())
 }
 receive(job:JobView) {
  if(!this.snapshot.dirty && !this.snapshot.saving && !this.snapshot.forms.details && !this.snapshot.forms.completion.open && job.revision>this.saved.revision) {this.saved=job;this.publish()}
 }
 watchAuth=()=>{
  if(this.authSubscription || !this.active)return
  this.authSubscription=createAuthBrowserClient().auth.onAuthStateChange((event,session)=>{
   if(session && session.user.id!==this.owner)clearChecklistDrafts(this.owner)
   else if(event==='SIGNED_OUT')this.suspend()
  }).data.subscription
  this.stopLogout=onGarageSignOut(()=>clearChecklistDrafts(this.owner))
 }
 private suspend() {
  this.suspended=true;this.generation++
  this.failed=this.inFlight??this.failed;this.failedDetails=this.inFlightDetails??this.failedDetails
  this.publish({error:'Sign in again to save. Your unsaved work stays in this tab.'})
 }
 private resume() {
  if(!this.suspended)return
  this.suspended=false
  this.publish({error:this.failed || this.failedDetails?'Your session was restored. Retry save to check the saved version.':null})
  if(!this.failed && !this.failedDetails && !this.timer)void this.flush()
 }
 dispose() {this.stopLogout?.();this.authSubscription?.unsubscribe();this.active=false;this.generation++;if(this.timer)clearTimeout(this.timer);this.pending.clear();this.failed=null;this.failedDetails=null;this.listeners.clear()}
 setReason=(id:string,value:ReasonDraft|null)=>{
  const reasons={...this.snapshot.forms.reasons};if(value)reasons[id]=value;else delete reasons[id]
  this.publish({forms:{...this.snapshot.forms,reasons}})
 }
 setCompletion=(value:ChecklistForms['completion'])=>this.publish({forms:{...this.snapshot.forms,completion:value}})
 setDetails=(draft:JobDetailsFormDraft|null)=>this.publish({forms:{...this.snapshot.forms,details:draft?{draft,baseline:this.snapshot.forms.details?.baseline??draft}:null}})
 setTask=(id:string,patch:TaskPatch)=>{
  if(!this.active)return
  this.edits++
  this.pending.set(id,{...this.pending.get(id),...patch})
  this.publish()
  if(this.timer)clearTimeout(this.timer)
  if(patch.state!==undefined) {this.timer=null;void this.flush()}
  else this.timer=setTimeout(()=>{this.timer=null;void this.flush()},500)
 }
 private acknowledge(request:Request,job:JobView) {
  this.saved=job
  const remaining={...this.pending.get(request.taskId)}
  for(const key of Object.keys(request.patch) as (keyof TaskPatch)[]) if(remaining[key]===request.patch[key]) delete remaining[key]
  if(Object.keys(remaining).length)this.pending.set(request.taskId,remaining);else this.pending.delete(request.taskId)
  this.failed=null
 }
 private async flush(request?:Request) {
  if(!this.active || this.suspended || this.snapshot.saving || this.snapshot.error && !request || this.pending.size===0)return
  const [taskId,patch]=this.pending.entries().next().value!
  const write=request ?? {taskId,patch:{...patch},revision:this.saved.revision}
  const generation=this.generation
  this.inFlight=write
  this.publish({saving:true,error:null,conflict:false})
  try {
   const result=await saveTaskPatchAction(this.saved.id,write.revision,write.taskId,write.patch)
   if(!this.active || generation!==this.generation)return
   if(result.ok)this.acknowledge(write,result.value)
   else {this.failed=write;this.publish({error:result.error==='conflict'?'This job changed on another device':result.message,conflict:result.error==='conflict'})}
  } catch(error) {
   if(!this.active || generation!==this.generation)return
   this.failed=write;this.publish({error:error instanceof Error?error.message:'Could not save. Retry when connected.'})
  } finally {
   this.inFlight=null
   if(this.active) {this.publish({saving:false});if(!this.suspended && !this.snapshot.error && !this.timer)void this.flush()}
  }
 }
 retry=async()=>{
  if(this.failedDetails) {await this.retryDetails();return}
  const request=this.failed
  if(!request || this.suspended || this.snapshot.saving || this.snapshot.conflict)return
  const generation=this.generation
  this.publish({saving:true})
  try {
   // A lost response may have committed. Check the exact patch before replaying it.
   const current=await loadChecklistAction(this.saved.id)
   if(!this.active || generation!==this.generation)return
   const task=current.tasks.find(task=>task.id===request.taskId)
   const applied=current.revision>request.revision && task && (Object.keys(request.patch) as (keyof TaskPatch)[]).every(key=>task[key]===request.patch[key])
   if(applied) {this.acknowledge(request,current);this.publish({saving:false,error:null,conflict:false});void this.flush();return}
   if(current.revision!==request.revision) {this.publish({saving:false,error:'This job changed on another device',conflict:true});return}
   this.publish({saving:false,error:null});void this.flush(request)
  } catch(error) {if(this.active && generation===this.generation)this.publish({saving:false,error:error instanceof Error?error.message:'Could not check saved version. Retry when connected.'})}
 }
 reload=async()=>{
  if(this.snapshot.saving)return
  const generation=this.generation,edits=this.edits
  const job=await loadChecklistAction(this.saved.id)
  if(!this.active || generation!==this.generation)return
  if(edits!==this.edits)throw new Error('New changes were entered while reloading. Copy your notes and reload again.')
  if(this.timer)clearTimeout(this.timer)
  this.timer=null;this.pending.clear();this.failed=null;this.failedDetails=null;this.saved=job;this.publish({error:null,conflict:false,forms:{reasons:{},completion:{open:false,date:job.date,mileage:String(job.mileageKm)},details:null}})
 }
 reconcile=async()=>{
  this.resume()
  // Never replace a draft during session restoration or focus changes.
  if(this.snapshot.dirty || this.snapshot.saving || this.snapshot.forms.details || this.snapshot.forms.completion.open)return
  await this.reload()
 }
 private async retryDetails() {
  const request=this.failedDetails
  if(!request || this.suspended || this.snapshot.saving || this.snapshot.conflict)return
  const generation=this.generation;this.publish({saving:true})
  try {
   const current=await loadChecklistAction(this.saved.id)
   if(!this.active || generation!==this.generation)return
   if(current.revision>request.job.revision && request.matches(current)) {
    this.saved=current;this.failedDetails=null;this.publish({saving:false,error:null});void this.flush();return
   }
   if(current.revision!==request.job.revision) {this.publish({saving:false,error:'This job changed on another device',conflict:true});return}
   this.failedDetails=null;this.publish({saving:false,error:null})
   await this.saveDetails(request.write,request.matches,true)
  } catch(error) {if(this.active && generation===this.generation)this.publish({saving:false,error:error instanceof Error?error.message:'Could not check saved version.'})}
 }
 private async saveDetails(write:(job:JobView)=>Promise<SavedResult<JobView>>,matches:(job:JobView)=>boolean,retrying=false) {
  if(this.suspended || (!retrying && this.snapshot.queueDirty) || this.snapshot.saving) return {ok:false,error:'save_failed',message:'Save the task changes first.'} as SavedResult<JobView>
  const request={job:this.saved,write,matches}
  const generation=this.generation;this.inFlightDetails=request;this.publish({saving:true,error:null})
  try {
   const result=await write(request.job)
   if(!this.active)throw new Error('Account changed')
   if(generation!==this.generation)throw new Error('Sign in again and retry this save.')
   if(result.ok)this.saved=result.value
   else if(result.error!=='invalid') {this.failedDetails=request;this.publish({error:result.error==='conflict'?'This job changed on another device':result.message,conflict:result.error==='conflict'})}
   return result
  } catch(error) {
   if(this.active && generation===this.generation) {this.failedDetails=request;this.publish({error:error instanceof Error?error.message:'Could not save.'})}
   throw error
  } finally {this.inFlightDetails=null;if(this.active) {this.publish({saving:false});if(!this.suspended && !this.snapshot.error && !this.timer)void this.flush()}}
 }
 complete=(date:string,mileage:number)=>this.saveDetails(job=>closeJobAction(job.id,job.revision,date,mileage),job=>job.closeReason==='manual' && job.date===date && job.mileageKm===mileage)
 correct=(details:JobDetails)=>this.saveDetails(job=>correctChecklistAction(job.id,job.revision,details),job=>(Object.keys(details) as (keyof JobDetails)[]).every(key=>job[key]===details[key]))
}
