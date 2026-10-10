'use server'

import { revalidatePath } from 'next/cache'
import { getAccount } from '@/lib/account'
import { addBike, editBike, listBikes, archiveBike, removeBike, importSelectedModels, getBike } from '@/lib/garageRepository.server'
import { startJob, listJobs, getJob, createQuickJob, editJobDetails, deleteJob } from '@/lib/maintenance/jobsRepository.server'
import { cleanupOwnedFiles, listPrivateFiles } from '@/lib/maintenance/uploads.server'
import type { PrivateFile, JobDraft, JobView, SavedResult } from '@/lib/maintenance/types'
import type { JobDetails } from '@/lib/maintenance/validation'
import type { BikeInput, BikeView } from '@/lib/garageBikes'

async function accountFor(ownerId: string) {
  const account = await getAccount()
  if (!account || account.userId !== ownerId) throw new Error('Sign in again to save. Your changes have not been saved.')
  return account
}
function invalidateBike(id: string) {
  revalidatePath('/garage')
  revalidatePath(`/garage/${id}`)
}
export async function saveBike(input: BikeInput, id: string, ownerId: string, editing = false): Promise<BikeView> {
  const account = await accountFor(ownerId)
  const bike = await (editing ? editBike(account, id, input) : addBike(account, input, id))
  invalidateBike(id)
  return bike
}
export async function loadBikes(archived: boolean, ownerId: string) {
  return listBikes(await accountFor(ownerId), archived)
}
export async function setArchived(id: string, archived: boolean, ownerId: string) {
  await archiveBike(await accountFor(ownerId), id, archived)
  invalidateBike(id)
}
export async function deleteBike(id: string, confirmed: boolean, ownerId: string) {
  if (confirmed !== true) throw new Error('Confirm removal first.')
  const account=await accountFor(ownerId)
  await cleanupOwnedFiles(account,id)
  await removeBike(account,id)
  invalidateBike(id)
}
export async function importModels(ids: string[], ownerId: string): Promise<{ bikes: BikeView[]; failed: string[] }> {
  const account = await accountFor(ownerId)
  const bikes: BikeView[] = []
  const failed: string[] = []
  for (const id of new Set(ids)) {
    try { bikes.push(...await importSelectedModels(account, [id])) }
    catch { failed.push(id) }
  }
  for (const bike of bikes) invalidateBike(bike.id)
  return { bikes, failed }
}

export async function loadBikeWorkspace(bikeId: string, ownerId: string): Promise<{bike:BikeView;jobs:JobView[];files:PrivateFile[]}> {
  const account=await accountFor(ownerId)
  const bike=await getBike(account,bikeId)
  if(!bike) throw new Error('Bike not found')
  return {bike,jobs:await listJobs(account,bikeId),files:await listPrivateFiles(account,bikeId)}
}
export async function saveQuickJob(draft:JobDraft,ownerId:string):Promise<SavedResult<JobView>> {
  const result=await createQuickJob(await accountFor(ownerId),draft)
  if(result.ok) invalidateBike(result.value.bikeId)
  return result
}
export async function correctJob(id:string,bikeId:string,revision:number,details:JobDetails,ownerId:string):Promise<SavedResult<JobView>> {
  const account=await accountFor(ownerId)
  const job=await getJob(account,id)
  if(!job || job.bikeId!==bikeId) return {ok:false,error:'not_found',message:'Job not found'}
  const result=await editJobDetails(account,id,revision,details)
  if(result.ok) invalidateBike(bikeId)
  return result
}
export async function removeJob(id:string,bikeId:string,confirmed:boolean,ownerId:string):Promise<SavedResult<null>> {
  if(confirmed!==true) throw new Error('Confirm removal first.')
  const account=await accountFor(ownerId)
  const job=await getJob(account,id)
  if(!job || job.bikeId!==bikeId) return {ok:false,error:'not_found',message:'Job not found'}
  try {await cleanupOwnedFiles(account,bikeId,id)}
  catch(error) {return {ok:false,error:'save_failed',message:error instanceof Error?error.message:'File cleanup failed. Retry removal.'}}
  const result=await deleteJob(account,id)
  if(result.ok) invalidateBike(bikeId)
  return result
}

export async function startMaintenanceJob(draft:JobDraft,carry:import('@/lib/maintenance/carryover').CarrySelection|null,ownerId:string):Promise<SavedResult<JobView>> {
 const result=await startJob(await accountFor(ownerId),draft,carry)
 if(result.ok) invalidateBike(result.value.bikeId)
 return result
}
