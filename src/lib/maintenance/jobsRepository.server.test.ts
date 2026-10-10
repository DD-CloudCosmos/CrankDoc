import { beforeEach, expect, it, vi } from 'vitest'
import type { AccountContext } from '@/lib/account'
import { jobFixture, taskFixture } from '@/test/garageFixtures'
import { closeJob, saveTaskPatch, createQuickJob, deleteJob, editJobDetails, getJob, listJobs } from './jobsRepository.server'
const draft = jobFixture({tasks:[taskFixture({state:'done',doneAt:'2026-10-10T10:00:00Z',origin:null,key:null})]})
const row = {id:draft.id,owner_id:'owner',bike_id:draft.bikeId,title:draft.title,job_date:draft.date,mileage_km:draft.mileageKm,tasks:draft.tasks,template_id:null,template_version:null,template_snapshot:null,notes:'',parts:'',performer:'',cost_minor:null,currency:null,revision:1,status:'completed',close_reason:'all_done',closed_at:'2026-10-10T10:00:00Z',created_at:'2026-10-10T10:00:00Z'}
type Response = {data:unknown;error:null|{code:string;details?:string}}
let responses: Response[]
const queries: {eq:ReturnType<typeof vi.fn>;order:ReturnType<typeof vi.fn>}[]=[]
const rpc = vi.fn(async (_name: string, _params: Record<string, unknown>) => { void _name; void _params; return responses.shift() })
const client = {rpc,from:vi.fn(() => {
  const result = responses.shift()
  const q = {eq:vi.fn(),order:vi.fn(),select:vi.fn(),range:vi.fn(),delete:vi.fn(),maybeSingle:vi.fn(),then:(resolve:(v:Response|undefined)=>void)=>Promise.resolve(result).then(resolve)}
  for (const key of ['eq','order','select','range','delete','maybeSingle'] as const) q[key].mockReturnValue(q)
  queries.push(q); return q
})}
const account = {client,userId:'owner'} as unknown as AccountContext
beforeEach(() => {responses=[];queries.length=0;vi.clearAllMocks()})
it('maps stored facts and sorts/filters list reads by owner and bike',async () => {
  responses=[{data:[row],error:null},{data:[],error:null},{data:row,error:null},{data:null,error:null}]
  expect((await listJobs(account,draft.bikeId))[0]).toMatchObject({status:'completed',costMinor:null,date:draft.date})
  expect(queries[0].eq).toHaveBeenCalledWith('owner_id','owner')
  expect(queries[0].eq).toHaveBeenCalledWith('bike_id',draft.bikeId)
  expect(queries[0].order).toHaveBeenCalledWith('job_date',{ascending:false})
  expect((await getJob(account,draft.id))?.id).toBe(draft.id)
  expect(await getJob(account,draft.id)).toBeNull()
})
it('calls atomic create without caller-supplied ownership',async () => {
  responses=[{data:row,error:null}]
  expect(await createQuickJob(account,draft)).toMatchObject({ok:true,value:{revision:1}})
  expect(rpc).toHaveBeenCalledWith('create_quick_job',{p_draft:expect.objectContaining({id:draft.id,bikeId:draft.bikeId})})
  expect(rpc.mock.calls[0][1].p_draft).not.toHaveProperty('owner_id')
})
it('rejects quick jobs with unfinished tasks, template or origins before saving',async () => {
  expect((await createQuickJob(account,jobFixture())).ok).toBe(false)
  expect(rpc).not.toHaveBeenCalled()
})
it('returns current record for revision conflict without retrying edits',async () => {
  responses=[{data:null,error:{code:'PT409',details:JSON.stringify({...row,revision:2})}}]
  expect(await editJobDetails(account,draft.id,1,draft)).toMatchObject({ok:false,error:'conflict',current:{revision:2}})
  expect(rpc).toHaveBeenCalledTimes(1)
})
it('rejects invalid edit identifiers, revision and details before saving',async () => {
  expect(await editJobDetails(account,'bad',1,draft)).toMatchObject({error:'invalid'})
  expect(await editJobDetails(account,draft.id,0,draft)).toMatchObject({error:'invalid'})
  expect(await editJobDetails(account,draft.id,1,{...draft,title:''})).toMatchObject({error:'invalid'})
  expect(rpc).not.toHaveBeenCalled()
})
it.each([['PT404','not_found'],['22023','invalid'],['23505','invalid'],['XX000','save_failed']])('maps database error %s',async (code,error) => {
  responses=[{data:null,error:{code}}]
  expect(await createQuickJob(account,draft)).toMatchObject({ok:false,error})
})
it('edits and explicitly deletes owned jobs',async () => {
  responses=[{data:{...row,revision:2,cost_minor:0,currency:'EUR'},error:null},{data:{id:draft.id},error:null},{data:null,error:null}]
  expect(await editJobDetails(account,draft.id,1,draft)).toMatchObject({ok:true,value:{revision:2,costMinor:0,currency:'EUR'}})
  expect(await deleteJob(account,draft.id)).toEqual({ok:true,value:null})
  expect(queries[0].eq).toHaveBeenCalledWith('owner_id','owner')
  expect(await deleteJob(account,draft.id)).toMatchObject({error:'not_found'})
})
it('reports read and deletion failures',async () => {
  responses=Array(3).fill({data:null,error:{code:'XX000'}})
  await expect(listJobs(account,draft.bikeId)).rejects.toThrow()
  await expect(getJob(account,draft.id)).rejects.toThrow()
  expect(await deleteJob(account,draft.id)).toMatchObject({error:'save_failed'})
})
it('loads 1001 jobs beyond response caps, including caps smaller than the requested page',async()=>{
 const rows=Array.from({length:1001},(_,i)=>({...row,id:`00000000-0000-4000-8000-${String(i).padStart(12,'0')}`}))
 const paged={from:()=>{let offset=0;const q={select:()=>q,eq:()=>q,order:()=>q,range:(start:number)=>{offset=start;return q},then:(resolve:(value:Response)=>void)=>Promise.resolve({data:rows.slice(offset,offset+400),error:null}).then(resolve)};return q}}
 expect(await listJobs({client:paged,userId:'owner'} as unknown as AccountContext,draft.bikeId)).toHaveLength(1001)
})

it('saves one task patch and closes through atomic functions',async()=>{
 responses=[{data:{...row,revision:2},error:null},{data:{...row,revision:3,close_reason:'manual'},error:null}]
 expect(await saveTaskPatch(account,draft.id,1,draft.tasks[0].id,{state:'done'})).toMatchObject({ok:true,value:{revision:2}})
 expect(rpc).toHaveBeenCalledWith('save_task_patch',{p_job_id:draft.id,p_expected_revision:1,p_task_id:draft.tasks[0].id,p_patch:{state:'done'}})
 expect(await closeJob(account,draft.id,2,draft.date,0)).toMatchObject({ok:true,value:{revision:3,closeReason:'manual'}})
})
it('rejects malformed patches and close details before writes',async()=>{
 for(const patch of [{state:'fake'},{notes:null},{reason:'x'.repeat(501)},{label:'Injected'}]) expect(await saveTaskPatch(account,draft.id,1,draft.tasks[0].id,patch as never)).toMatchObject({error:'invalid'})
 expect(await saveTaskPatch(account,draft.id,0,draft.tasks[0].id,{})).toMatchObject({error:'invalid'})
 expect(await closeJob(account,draft.id,1,'2026-02-30',0)).toMatchObject({error:'invalid'})
 expect(await closeJob(account,draft.id,1,draft.date,0.0001)).toMatchObject({error:'invalid'})
 expect(rpc).not.toHaveBeenCalled()
})
it('returns current task conflict without retrying and hides foreign jobs',async()=>{
 responses=[{data:null,error:{code:'PT409',details:JSON.stringify({...row,revision:4})}},{data:null,error:{code:'PT404'}}]
 expect(await saveTaskPatch(account,draft.id,1,draft.tasks[0].id,{})).toMatchObject({error:'conflict',current:{revision:4}})
 expect(await closeJob(account,draft.id,1,draft.date,0)).toMatchObject({error:'not_found'})
 expect(rpc).toHaveBeenCalledTimes(2)
})
it('starts work using only source identifiers and maps source conflicts',async()=>{
 const {startJob}=await import('./jobsRepository.server')
 const carry={sourceJobId:draft.id,sourceRevision:1,taskIds:[draft.tasks[0].id],closePrevious:true}
 responses=[{data:row,error:null},{data:null,error:{code:'PT409',details:JSON.stringify({...row,revision:2})}}]
 expect(await startJob(account,jobFixture(),carry)).toMatchObject({ok:true})
 expect(rpc).toHaveBeenLastCalledWith('start_maintenance_job',{p_draft:expect.any(Object),p_source_job_id:carry.sourceJobId,p_source_revision:1,p_task_ids:carry.taskIds,p_close_previous:true})
 expect(await startJob(account,jobFixture(),carry)).toMatchObject({error:'conflict',current:{revision:2}})
})
it('rejects caller origins and malformed carry selections before writes',async()=>{
 const {startJob}=await import('./jobsRepository.server')
 const carry={sourceJobId:draft.id,sourceRevision:1,taskIds:[draft.tasks[0].id],closePrevious:false}
 for(const selection of [{...carry,sourceRevision:0},{...carry,taskIds:['bad']},{...carry,taskIds:[draft.tasks[0].id,draft.tasks[0].id]},{...carry,closePrevious:'yes'}]) expect(await startJob(account,jobFixture(),selection as never)).toMatchObject({error:'invalid'})
 expect(await startJob(account,jobFixture({tasks:[taskFixture({origin:{jobId:draft.id,taskId:draft.tasks[0].id,previousNotes:'Forged'}})]}),carry)).toMatchObject({error:'invalid'})
 expect(rpc).not.toHaveBeenCalled()
})
