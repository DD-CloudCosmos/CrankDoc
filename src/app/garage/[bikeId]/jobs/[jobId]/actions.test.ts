import { beforeEach, expect, it, vi } from 'vitest'
import { revalidatePath } from 'next/cache'
import { getAccount } from '@/lib/account'
import * as jobs from '@/lib/maintenance/jobsRepository.server'
import { jobFixture } from '@/test/garageFixtures'
import { saveTaskPatchAction, loadChecklistAction, closeJobAction, correctChecklistAction } from './actions'
vi.mock('next/cache',()=>({revalidatePath:vi.fn()}))
vi.mock('@/lib/account',()=>({getAccount:vi.fn()}))
vi.mock('@/lib/maintenance/jobsRepository.server',()=>({getJob:vi.fn(),saveTaskPatch:vi.fn(),closeJob:vi.fn(),editJobDetails:vi.fn()}))
const job=jobFixture();const account={userId:'owner'} as NonNullable<Awaited<ReturnType<typeof getAccount>>>
beforeEach(()=>{vi.clearAllMocks();vi.mocked(getAccount).mockResolvedValue(account)})
it('requires the current authenticated account for every route action',async()=>{
 vi.mocked(getAccount).mockResolvedValue(null)
 await expect(saveTaskPatchAction(job.id,1,job.tasks[0].id,{notes:'Private'})).rejects.toThrow('Sign in again')
 await expect(loadChecklistAction(job.id)).rejects.toThrow('Sign in again')
 await expect(closeJobAction(job.id,1,job.date,job.mileageKm)).rejects.toThrow('Sign in again')
 await expect(correctChecklistAction(job.id,1,job)).rejects.toThrow('Sign in again')
 expect(jobs.saveTaskPatch).not.toHaveBeenCalled()
})
it('dispatches authenticated writes and invalidates history only on successful saves',async()=>{
 vi.mocked(jobs.saveTaskPatch).mockResolvedValueOnce({ok:false,error:'save_failed',message:'Failed'}).mockResolvedValueOnce({ok:true,value:job})
 await saveTaskPatchAction(job.id,1,job.tasks[0].id,{state:'done'});expect(revalidatePath).not.toHaveBeenCalled()
 await saveTaskPatchAction(job.id,1,job.tasks[0].id,{state:'done'})
 expect(jobs.saveTaskPatch).toHaveBeenCalledWith(account,job.id,1,job.tasks[0].id,{state:'done'})
 expect(revalidatePath).toHaveBeenCalledWith(`/garage/${job.bikeId}`)
 vi.mocked(jobs.closeJob).mockResolvedValue({ok:true,value:job});await closeJobAction(job.id,1,job.date,job.mileageKm)
 expect(jobs.closeJob).toHaveBeenCalledWith(account,job.id,1,job.date,job.mileageKm)
 vi.mocked(jobs.editJobDetails).mockResolvedValue({ok:true,value:job});await correctChecklistAction(job.id,1,job)
 expect(jobs.editJobDetails).toHaveBeenCalledWith(account,job.id,1,job)
})
it('reloads only owner-visible jobs and handles missing jobs',async()=>{
 vi.mocked(jobs.getJob).mockResolvedValueOnce(job).mockResolvedValueOnce(null)
 expect(await loadChecklistAction(job.id)).toEqual(job);expect(jobs.getJob).toHaveBeenCalledWith(account,job.id)
 await expect(loadChecklistAction(job.id)).rejects.toThrow('Job not found')
})
