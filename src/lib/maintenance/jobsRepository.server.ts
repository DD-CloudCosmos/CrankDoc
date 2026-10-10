import type { AccountContext } from '@/lib/account'
import type { Json, Tables } from '@/types/database.types'
import type { JobDraft, JobView, SavedResult, TaskPatch } from './types'
import { parseTaskPatch, parseJobDetails, parseJobDraft, requireJobId, type JobDetails } from './validation'

type JobRow = Tables<'maintenance_jobs'>
function view(row: JobRow): JobView {
  const draft = parseJobDraft({id:row.id,bikeId:row.bike_id,title:row.title,date:row.job_date,mileageKm:row.mileage_km,
    tasks:row.tasks,template:row.template_snapshot,notes:row.notes,parts:row.parts,performer:row.performer,costMinor:row.cost_minor,currency:row.currency})
  if (!['in_progress','completed','partial'].includes(row.status) || (row.close_reason !== null && !['all_done','manual'].includes(row.close_reason))) throw new Error('Invalid stored job')
  return {...draft,revision:row.revision,status:row.status as JobView['status'],closeReason:row.close_reason as JobView['closeReason'],closedAt:row.closed_at,createdAt:row.created_at}
}
function json(input: JobDraft | JobDetails): Json { return JSON.parse(JSON.stringify(input)) as Json }
function failure<T>(error: {code?:string}): SavedResult<T> {
  if (error.code === 'PT404') return {ok:false,error:'not_found',message:'Job or bike not found'}
  if (error.code?.startsWith('22') || error.code?.startsWith('23')) return {ok:false,error:'invalid',message:'Check the maintenance details'}
  return {ok:false,error:'save_failed',message:'Could not save maintenance record'}
}
export async function listJobs(account: AccountContext, bikeId: string): Promise<JobView[]> {
  const id=requireJobId(bikeId)
  const jobs:JobView[]=[]
  while(true) {
    const {data,error}=await account.client.from('maintenance_jobs').select('*').eq('owner_id',account.userId).eq('bike_id',id)
      .order('job_date',{ascending:false}).order('created_at',{ascending:false}).order('id',{ascending:false}).range(jobs.length,jobs.length+999)
    if(error) throw new Error('Could not load maintenance history')
    if(!data?.length) return jobs
    jobs.push(...data.map(view))
  }
}
export async function getJob(account: AccountContext, jobId: string): Promise<JobView | null> {
  const {data,error} = await account.client.from('maintenance_jobs').select('*').eq('owner_id',account.userId).eq('id',requireJobId(jobId)).maybeSingle()
  if (error) throw new Error('Could not load maintenance record')
  return data ? view(data) : null
}
export async function createQuickJob(account: AccountContext, draft: JobDraft): Promise<SavedResult<JobView>> {
  let parsed: JobDraft
  try {
    parsed = parseJobDraft(draft)
    if (parsed.template !== null || parsed.tasks.some(t => t.state !== 'done' || t.origin !== null)) throw new Error('Quick entries require performed tasks')
  } catch { return {ok:false,error:'invalid',message:'Check the maintenance details'} }
  const {data,error} = await account.client.rpc('create_quick_job',{p_draft:json(parsed)})
  if (error) return failure(error)
  return data ? {ok:true,value:view(data)} : {ok:false,error:'save_failed',message:'Could not save maintenance record'}
}
export async function editJobDetails(account: AccountContext, jobId: string, revision: number, input: JobDetails): Promise<SavedResult<JobView>> {
  let details: JobDetails
  try {
    requireJobId(jobId)
    if (!Number.isInteger(revision) || revision < 1 || revision > 2147483647) throw new Error('Invalid revision')
    details = parseJobDetails(input)
  } catch { return {ok:false,error:'invalid',message:'Check the maintenance details'} }
  const {data,error} = await account.client.rpc('edit_job_details',{p_job_id:jobId,p_expected_revision:revision,p_details:json(details)})
  if (error?.code === 'PT409') {
    const current = view(JSON.parse(error.details) as JobRow)
    return {ok:false,error:'conflict',message:'This job changed on another device. Reload before saving.',current}
  }
  if (error) return failure(error)
  return data ? {ok:true,value:view(data)} : {ok:false,error:'save_failed',message:'Could not save maintenance record'}
}
// Call only after an explicit removal action. Mileage is never inferred from remaining jobs.
export async function deleteJob(account: AccountContext, jobId: string): Promise<SavedResult<null>> {
  try { requireJobId(jobId) } catch { return {ok:false,error:'invalid',message:'Invalid job identifier'} }
  const {data,error} = await account.client.from('maintenance_jobs').delete().eq('owner_id',account.userId).eq('id',jobId).select('id').maybeSingle()
  if (error) return failure(error)
  return data ? {ok:true,value:null} : {ok:false,error:'not_found',message:'Job not found'}
}

export async function saveTaskPatch(account: AccountContext, jobId: string, revision: number, taskId: string, patch: TaskPatch): Promise<SavedResult<JobView>> {
  let parsed: TaskPatch
  try {
    requireJobId(jobId); requireJobId(taskId)
    if (!Number.isInteger(revision) || revision < 1 || revision > 2147483647) throw new Error('Invalid revision')
    parsed = parseTaskPatch(patch)
  } catch { return {ok:false,error:'invalid',message:'Check the maintenance details'} }
  const {data,error} = await account.client.rpc('save_task_patch',{p_job_id:jobId,p_expected_revision:revision,p_task_id:taskId,p_patch:parsed as Json})
  if (error?.code === 'PT409') return {ok:false,error:'conflict',message:'This job changed on another device. Reload before saving.',current:view(JSON.parse(error.details) as JobRow)}
  if (error) return failure(error)
  return data ? {ok:true,value:view(data)} : {ok:false,error:'save_failed',message:'Could not save maintenance record'}
}
export async function closeJob(account: AccountContext, jobId: string, revision: number, date: string, mileageKm: number): Promise<SavedResult<JobView>> {
  try {
    requireJobId(jobId)
    if (!Number.isInteger(revision) || revision < 1 || revision > 2147483647) throw new Error('Invalid revision')
    parseJobDetails({title:'Close',date,mileageKm,notes:'',parts:'',performer:'',costMinor:null,currency:null})
  } catch { return {ok:false,error:'invalid',message:'Check the maintenance details'} }
  const {data,error} = await account.client.rpc('close_maintenance_job',{p_job_id:jobId,p_expected_revision:revision,p_date:date,p_mileage:mileageKm})
  if (error?.code === 'PT409') return {ok:false,error:'conflict',message:'This job changed on another device. Reload before saving.',current:view(JSON.parse(error.details) as JobRow)}
  if (error) return failure(error)
  return data ? {ok:true,value:view(data)} : {ok:false,error:'save_failed',message:'Could not save maintenance record'}
}

export async function startJob(account:AccountContext,draft:JobDraft,carry:import('./carryover').CarrySelection|null=null):Promise<SavedResult<JobView>> {
 let parsed:JobDraft
 try {
  parsed=parseJobDraft(draft)
  if(parsed.tasks.some(task=>task.origin!==null || !['todo','done'].includes(task.state) || (task.state==='todo' && (task.notes!=='' || task.reason!=='')))) throw new Error('Invalid new tasks')
  if(carry) {
   requireJobId(carry.sourceJobId)
   if(!Number.isInteger(carry.sourceRevision)||carry.sourceRevision<1||carry.sourceRevision>2147483647||!Array.isArray(carry.taskIds)||carry.taskIds.length>100||new Set(carry.taskIds).size!==carry.taskIds.length||typeof carry.closePrevious!=='boolean') throw new Error('Invalid selection')
   carry.taskIds.forEach(requireJobId)
  }
 } catch {return {ok:false,error:'invalid',message:'Check the maintenance details'}}
 const {data,error}=await account.client.rpc('start_maintenance_job',{p_draft:json(parsed),...(carry?{p_source_job_id:carry.sourceJobId,p_source_revision:carry.sourceRevision,p_task_ids:carry.taskIds,p_close_previous:carry.closePrevious}:{})})
 if(error?.code==='PT409') return {ok:false,error:'conflict',message:'Previous activity changed. Reload before carrying work.',current:view(JSON.parse(error.details) as JobRow)}
 if(error) return failure(error)
 return data?{ok:true,value:view(data)}:{ok:false,error:'save_failed',message:'Could not save maintenance record'}
}
