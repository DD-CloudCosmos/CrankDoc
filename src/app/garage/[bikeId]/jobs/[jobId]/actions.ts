'use server'
import { revalidatePath } from 'next/cache'
import { getAccount } from '@/lib/account'
import { getJob, saveTaskPatch, closeJob, editJobDetails } from '@/lib/maintenance/jobsRepository.server'
import type { JobView, SavedResult, TaskPatch } from '@/lib/maintenance/types'
import type { JobDetails } from '@/lib/maintenance/validation'
async function account() {
 const value=await getAccount()
 if(!value) throw new Error('Sign in again to save. Your changes have not been saved.')
 return value
}
function invalidate(result:SavedResult<JobView>) {
 if(result.ok) {revalidatePath(`/garage/${result.value.bikeId}`);revalidatePath(`/garage/${result.value.bikeId}/jobs/${result.value.id}`)}
 return result
}
export async function saveTaskPatchAction(jobId:string,revision:number,taskId:string,patch:TaskPatch):Promise<SavedResult<JobView>> {
 return invalidate(await saveTaskPatch(await account(),jobId,revision,taskId,patch))
}
export async function loadChecklistAction(jobId:string):Promise<JobView> {
 const job=await getJob(await account(),jobId)
 if(!job) throw new Error('Job not found')
 return job
}
export async function closeJobAction(jobId:string,revision:number,date:string,mileageKm:number):Promise<SavedResult<JobView>> {
 return invalidate(await closeJob(await account(),jobId,revision,date,mileageKm))
}
export async function correctChecklistAction(jobId:string,revision:number,details:JobDetails):Promise<SavedResult<JobView>> {
 return invalidate(await editJobDetails(await account(),jobId,revision,details))
}
