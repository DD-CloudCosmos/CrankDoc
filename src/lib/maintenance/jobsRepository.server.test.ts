import { beforeEach, expect, it, vi } from 'vitest'
import type { AccountContext } from '@/lib/account'
import { jobFixture, taskFixture } from '@/test/garageFixtures'
import { createQuickJob, deleteJob, editJobDetails, getJob, listJobs } from './jobsRepository.server'
const draft = jobFixture({tasks:[taskFixture({state:'done',doneAt:'2026-10-10T10:00:00Z',origin:null,key:null})]})
const row = {id:draft.id,owner_id:'owner',bike_id:draft.bikeId,title:draft.title,job_date:draft.date,mileage_km:draft.mileageKm,tasks:draft.tasks,template_id:null,template_version:null,template_snapshot:null,notes:'',parts:'',performer:'',cost_minor:null,currency:null,revision:1,status:'completed',close_reason:'all_done',closed_at:'2026-10-10T10:00:00Z',created_at:'2026-10-10T10:00:00Z'}
type Response = {data:unknown;error:null|{code:string;details?:string}}
let responses: Response[]
const queries: {eq:ReturnType<typeof vi.fn>;order:ReturnType<typeof vi.fn>}[]=[]
const rpc = vi.fn(async (_name: string, _params: Record<string, unknown>) => { void _name; void _params; return responses.shift() })
const client = {rpc,from:vi.fn(() => {
  const result = responses.shift()
  const q = {eq:vi.fn(),order:vi.fn(),select:vi.fn(),delete:vi.fn(),maybeSingle:vi.fn(),then:(resolve:(v:Response|undefined)=>void)=>Promise.resolve(result).then(resolve)}
  for (const key of ['eq','order','select','delete','maybeSingle'] as const) q[key].mockReturnValue(q)
  queries.push(q); return q
})}
const account = {client,userId:'owner'} as unknown as AccountContext
beforeEach(() => {responses=[];queries.length=0;vi.clearAllMocks()})
it('maps stored facts and sorts/filters list reads by owner and bike',async () => {
  responses=[{data:[row],error:null},{data:row,error:null},{data:null,error:null}]
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
