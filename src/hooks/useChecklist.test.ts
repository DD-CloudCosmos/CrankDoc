import { fields } from '@/app/garage/[bikeId]/QuickJobForm'
import { announceGarageSignOut } from '@/lib/garageSession'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { jobFixture, taskFixture } from '@/test/garageFixtures'
import { applyTaskPatch } from '@/lib/maintenance/checklist'
import { useChecklist } from './useChecklist'
import { clearChecklistDrafts, checklistDraft } from './checklistDrafts'
import { saveTaskPatchAction, loadChecklistAction, closeJobAction, correctChecklistAction } from '@/app/garage/[bikeId]/jobs/[jobId]/actions'
vi.mock('@/app/garage/[bikeId]/jobs/[jobId]/actions',()=>({saveTaskPatchAction:vi.fn(),loadChecklistAction:vi.fn(),closeJobAction:vi.fn(),correctChecklistAction:vi.fn()}))
vi.mock('@/app/garage/PrivateGarage',()=>({useGarageOwner:()=> 'owner',useGarageReconciliation:()=>{}}))
let authChange:(event:string,session:{user:{id:string}}|null)=>void
vi.mock('@/lib/supabase/auth-browser',()=>({createAuthBrowserClient:()=>({auth:{onAuthStateChange:(callback:typeof authChange)=>{authChange=callback;return {data:{subscription:{unsubscribe:vi.fn()}}}}}})}))
beforeEach(()=>{vi.clearAllMocks();clearChecklistDrafts('owner')})
afterEach(()=>{vi.useRealTimers();clearChecklistDrafts('owner')})
it('flushes queued notes with checkbox changes and serializes writes across tasks',async()=>{
 vi.useFakeTimers();const second=taskFixture({id:'00000000-0000-4000-8000-000000000004',label:'Second'})
 const job=jobFixture({tasks:[taskFixture(),second]});let server=job;let finish!:(value:Awaited<ReturnType<typeof saveTaskPatchAction>>)=>void
 vi.mocked(saveTaskPatchAction).mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve})).mockImplementation(async(_id,_revision,id,patch)=>{server=applyTaskPatch(server,id,patch,'2026-10-10T12:00:00Z');return {ok:true,value:server}})
 const {result}=renderHook(()=>useChecklist(job))
 act(()=>{result.current.setTask(job.tasks[0].id,{notes:'Pending notes'});result.current.setTask(second.id,{state:'done'})})
 expect(saveTaskPatchAction).toHaveBeenCalledTimes(1)
 expect(saveTaskPatchAction).toHaveBeenCalledWith(job.id,1,job.tasks[0].id,{notes:'Pending notes'})
 act(()=>result.current.setTask(job.tasks[0].id,{notes:'Newer notes'}));expect(saveTaskPatchAction).toHaveBeenCalledTimes(1)
 server=applyTaskPatch(job,job.tasks[0].id,{notes:'Pending notes'},'2026-10-10T12:00:00Z')
 await act(async()=>{finish({ok:true,value:server});vi.advanceTimersByTime(500)})
 expect(vi.mocked(saveTaskPatchAction).mock.calls.map(call=>call[1])).toEqual([1,2,3])
 expect(result.current.job.tasks[0].notes).toBe('Newer notes')
 expect(result.current.job.tasks[1].state).toBe('done');expect(result.current.dirty).toBe(false)
})
it.each(['explicit-sign-out','SIGNED_IN'])('clears dormant owner drafts on %s, without relying on the route remaining mounted',async event=>{
 vi.mocked(saveTaskPatchAction).mockResolvedValue({ok:false,error:'save_failed',message:'Save failed'})
 const job=jobFixture();const hook=renderHook(()=>useChecklist(job))
 act(()=>hook.result.current.setTask(job.tasks[0].id,{state:'done'}));await waitFor(()=>expect(hook.result.current.error).toBe('Save failed'))
 hook.unmount();act(()=>{if(event==='explicit-sign-out')announceGarageSignOut();else authChange(event,{user:{id:'different'}})})
 const next=renderHook(()=>useChecklist(job));expect(next.result.current.job.tasks[0].state).toBe('todo');expect(next.result.current.dirty).toBe(false)
})
it('serializes typing during explicit completion and sends it with the new revision',async()=>{
 const job=jobFixture();let finish!:(value:Awaited<ReturnType<typeof closeJobAction>>)=>void
 vi.mocked(closeJobAction).mockImplementation(()=>new Promise(resolve=>{finish=resolve}))
 vi.mocked(saveTaskPatchAction).mockResolvedValue({ok:true,value:{...job,revision:3,tasks:[taskFixture({notes:'While closing'})],status:'partial',closeReason:'manual'}})
 const {result}=renderHook(()=>useChecklist(job))
 let closing:ReturnType<typeof result.current.complete>
 act(()=>{closing=result.current.complete(job.date,job.mileageKm)})
 act(()=>result.current.setTask(job.tasks[0].id,{notes:'While closing',state:'todo'}));expect(saveTaskPatchAction).not.toHaveBeenCalled()
 await act(async()=>{finish({ok:true,value:{...job,revision:2,status:'partial',closeReason:'manual'}});await closing})
 expect(saveTaskPatchAction).toHaveBeenCalledWith(job.id,2,job.tasks[0].id,{notes:'While closing',state:'todo'})
})
it('requires successful saved-version checks before retrying an ambiguous write',async()=>{
 vi.mocked(saveTaskPatchAction).mockRejectedValue(new Error('Network down'))
 vi.mocked(loadChecklistAction).mockRejectedValue(new Error('Still offline'))
 const job=jobFixture();const {result}=renderHook(()=>useChecklist(job))
 act(()=>result.current.setTask(job.tasks[0].id,{state:'done'}));await waitFor(()=>expect(result.current.error).toBe('Network down'))
 await act(async()=>{await result.current.retry()});expect(result.current.error).toBe('Still offline');expect(result.current.dirty).toBe(true);expect(saveTaskPatchAction).toHaveBeenCalledTimes(1)
})
it('recovers a lost manual-completion response without repeating closure',async()=>{
 const job=jobFixture();vi.mocked(closeJobAction).mockRejectedValue(new Error('Response lost'))
 vi.mocked(loadChecklistAction).mockResolvedValue({...job,revision:2,status:'partial',closeReason:'manual'})
 const {result}=renderHook(()=>useChecklist(job))
 await act(async()=>{await expect(result.current.complete(job.date,job.mileageKm)).rejects.toThrow('Response lost')})
 expect(result.current.dirty).toBe(true)
 await act(async()=>{await result.current.retry()})
 expect(closeJobAction).toHaveBeenCalledTimes(1);expect(result.current.job.status).toBe('partial');expect(result.current.dirty).toBe(false)
})
it('preserves input typed while an explicit reload is waiting',async()=>{
 const job=jobFixture();let finish!:(value:ReturnType<typeof jobFixture>)=>void
 vi.mocked(saveTaskPatchAction).mockResolvedValue({ok:false,error:'conflict',message:'Changed'})
 vi.mocked(loadChecklistAction).mockImplementation(()=>new Promise(resolve=>{finish=resolve}))
 const {result}=renderHook(()=>useChecklist(job))
 act(()=>result.current.setTask(job.tasks[0].id,{state:'done'}));await waitFor(()=>expect(result.current.conflict).toBe(true))
 let reloading:Promise<void>;act(()=>{reloading=result.current.reload()})
 act(()=>result.current.setTask(job.tasks[0].id,{notes:'Typed during reload'}))
 await act(async()=>{finish({...job,revision:2});await expect(reloading).rejects.toThrow('New changes were entered')})
 expect(result.current.job.tasks[0].notes).toBe('Typed during reload');expect(result.current.dirty).toBe(true)
})

it('does not cache private jobs in the shared server rendering process',()=>{
 const job=jobFixture()
 vi.stubGlobal('window',undefined)
 try {
  const first=checklistDraft('owner',job);first.receive({...job,revision:2})
  const second=checklistDraft('owner',job)
  expect(second.getSnapshot().job.revision).toBe(1)
  first.dispose();second.dispose()
 } finally {vi.unstubAllGlobals()}
})
it('retries a failed completion before sending edits entered during the failure',async()=>{
 const job=jobFixture();vi.mocked(closeJobAction).mockResolvedValueOnce({ok:false,error:'save_failed',message:'Could not complete'}).mockResolvedValueOnce({ok:true,value:{...job,revision:2,status:'partial',closeReason:'manual'}})
 vi.mocked(loadChecklistAction).mockResolvedValue(job)
 vi.mocked(saveTaskPatchAction).mockResolvedValue({ok:true,value:{...job,revision:3,status:'partial',closeReason:'manual',tasks:[taskFixture({notes:'New observations'})]}})
 const {result}=renderHook(()=>useChecklist(job))
 await act(async()=>{await result.current.complete(job.date,job.mileageKm)})
 act(()=>result.current.setTask(job.tasks[0].id,{state:'todo',notes:'New observations'}))
 await act(async()=>{await result.current.retry()})
 expect(vi.mocked(closeJobAction).mock.calls[1]).toEqual(vi.mocked(closeJobAction).mock.calls[0])
 expect(saveTaskPatchAction).toHaveBeenCalledWith(job.id,2,job.tasks[0].id,{state:'todo',notes:'New observations'})
 expect(result.current.dirty).toBe(false)
})
it('allows completion details to be corrected after validation failure',async()=>{
 const job=jobFixture();vi.mocked(closeJobAction).mockResolvedValueOnce({ok:false,error:'invalid',message:'Check the maintenance details'}).mockResolvedValueOnce({ok:true,value:{...job,revision:2,status:'partial',closeReason:'manual'}})
 const {result}=renderHook(()=>useChecklist(job))
 await act(async()=>{expect(await result.current.complete(job.date,0.0001)).toMatchObject({ok:false,error:'invalid'})})
 expect(result.current.dirty).toBe(false)
 await act(async()=>{expect(await result.current.complete(job.date,0)).toMatchObject({ok:true})})
 expect(closeJobAction).toHaveBeenLastCalledWith(job.id,1,job.date,0)
})
it('suspends an in-flight write on expiry, rejects its late acknowledgement, and reconciles it after owner verification',async()=>{
 const job=jobFixture();let finish!:(value:Awaited<ReturnType<typeof saveTaskPatchAction>>)=>void
 vi.mocked(saveTaskPatchAction).mockImplementation(()=>new Promise(resolve=>{finish=resolve}))
 const {result}=renderHook(()=>useChecklist(job));act(()=>result.current.setTask(job.tasks[0].id,{state:'done'}))
 act(()=>authChange('SIGNED_OUT',null))
 await act(async()=>{await result.current.retry()});expect(saveTaskPatchAction).toHaveBeenCalledTimes(1)
 const saved=applyTaskPatch(job,job.tasks[0].id,{state:'done'},'2026-10-10T12:00:00Z')
 await act(async()=>{finish({ok:true,value:saved})})
 expect(result.current.job.status).toBe('in_progress');expect(result.current.dirty).toBe(true)
 vi.mocked(loadChecklistAction).mockResolvedValue(saved)
 await act(async()=>{await checklistDraft('owner',job).reconcile();await result.current.retry()})
 expect(result.current.job.status).toBe('completed');expect(result.current.dirty).toBe(false);expect(saveTaskPatchAction).toHaveBeenCalledTimes(1)
})

it('keeps the original revision of an open untouched correction form so newer server changes conflict',async()=>{
 const job=jobFixture()
 vi.mocked(correctChecklistAction).mockResolvedValue({ok:false,error:'conflict',message:'Changed',current:{...job,revision:2}})
 const {result,rerender}=renderHook(({initial})=>useChecklist(initial),{initialProps:{initial:job}})
 act(()=>result.current.setDetails({input:fields(job),unit:'km',expanded:false}))
 rerender({initial:{...job,revision:2,date:'2026-10-11'}})
 await act(async()=>{await result.current.correct({...job,date:'2026-10-12'})})
 expect(correctChecklistAction).toHaveBeenCalledWith(job.id,1,expect.objectContaining({date:'2026-10-12'}))
 expect(result.current.conflict).toBe(true)
})
it.each([{kind:'task',settlement:'resolve'},{kind:'details',settlement:'resolve'},{kind:'task',settlement:'reject'},{kind:'details',settlement:'reject'}])('releases a stale $kind retry read after expiry when it $settlement without concurrent writes',async ({kind,settlement})=>{
 const job=jobFixture();let finish!:(value:ReturnType<typeof jobFixture>)=>void;let fail!:(error:Error)=>void
 vi.mocked(saveTaskPatchAction).mockReset();vi.mocked(closeJobAction).mockReset()
 vi.mocked(saveTaskPatchAction).mockResolvedValueOnce({ok:false,error:'save_failed',message:'Could not save'}).mockResolvedValue({ok:true,value:applyTaskPatch(job,job.tasks[0].id,{state:'done'},'2026-10-10T12:00:00Z')})
 vi.mocked(closeJobAction).mockResolvedValueOnce({ok:false,error:'save_failed',message:'Could not complete'}).mockResolvedValue({ok:true,value:{...job,revision:2,status:'partial',closeReason:'manual'}})
 vi.mocked(loadChecklistAction).mockImplementationOnce(()=>new Promise((resolve,reject)=>{finish=resolve;fail=reject})).mockResolvedValue(job)
 const {result}=renderHook(()=>useChecklist(job))
 if(kind==='task') {act(()=>result.current.setTask(job.tasks[0].id,{state:'done'}));await waitFor(()=>expect(result.current.error).toBe('Could not save'))}
 else await act(async()=>{await result.current.complete(job.date,job.mileageKm)})
 let reading!:Promise<void>;act(()=>{reading=result.current.retry()})
 expect(result.current.saving).toBe(true)
 act(()=>authChange('SIGNED_OUT',null))
 await act(async()=>{await checklistDraft('owner',job).reconcile();await result.current.retry()})
 expect(result.current.saving).toBe(true);expect(loadChecklistAction).toHaveBeenCalledTimes(1)
 expect(kind==='task'?saveTaskPatchAction:closeJobAction).toHaveBeenCalledTimes(1)
 await act(async()=>{if(settlement==='resolve')finish({...job,revision:99});else fail(new Error('Stale read failed'));await reading})
 expect(result.current.saving).toBe(false);expect(result.current.job.revision).toBe(1);expect(result.current.dirty).toBe(true)
 await act(async()=>{await result.current.retry()})
 await waitFor(()=>expect(result.current.dirty).toBe(false))
 expect(result.current.job.revision).toBe(2);expect(kind==='task'?saveTaskPatchAction:closeJobAction).toHaveBeenCalledTimes(2)
})
it.each(['reason','completion','details'])('retains newer raw %s form input when an earlier reload response arrives',async kind=>{
 const job=jobFixture();let finish!:(value:ReturnType<typeof jobFixture>)=>void
 vi.mocked(loadChecklistAction).mockImplementation(()=>new Promise(resolve=>{finish=resolve}))
 const {result}=renderHook(()=>useChecklist(job))
 let reading!:Promise<void>;act(()=>{reading=result.current.reload()})
 act(()=>{
  if(kind==='reason')result.current.setReason(job.tasks[0].id,{choice:'skipped',reason:'New reason'})
  else if(kind==='completion')result.current.setCompletion({open:true,date:'2026-10-12',mileage:'14000'})
  else {const baseline={input:fields(job),unit:'km' as const,expanded:false};result.current.setDetails(baseline);result.current.setDetails({...baseline,input:{...baseline.input,mileage:'15000'}})}
 })
 await act(async()=>{finish({...job,revision:2});await expect(reading).rejects.toThrow('New changes were entered')})
 if(kind==='reason')expect(result.current.forms.reasons[job.tasks[0].id]).toEqual({choice:'skipped',reason:'New reason'})
 else if(kind==='completion')expect(result.current.forms.completion).toEqual({open:true,date:'2026-10-12',mileage:'14000'})
 else expect(result.current.forms.details?.draft.input.mileage).toBe('15000')
 expect(result.current.dirty).toBe(true);expect(result.current.job.revision).toBe(1)
})
