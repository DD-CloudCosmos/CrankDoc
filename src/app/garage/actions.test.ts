import { revalidatePath } from 'next/cache'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAccount } from '@/lib/account'
import * as repository from '@/lib/garageRepository.server'
import { saveBike, loadBikes, setArchived, deleteBike, importModels } from './actions'
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/account', () => ({ getAccount: vi.fn() }))
vi.mock('@/lib/garageRepository.server', () => ({ addBike: vi.fn(), editBike: vi.fn(), listBikes: vi.fn(), archiveBike: vi.fn(), removeBike: vi.fn(), importSelectedModels: vi.fn(), getBike: vi.fn() }))
const input = { motorcycleId: null, nickname: '', make: 'Honda', model: 'Custom', year: null, variant: '', market: '', registration: '', mileageKm: null }
const account = { userId: 'a', client: {} } as Awaited<ReturnType<typeof getAccount>>
beforeEach(() => { vi.clearAllMocks(); vi.mocked(getAccount).mockResolvedValue(account) })
describe('garage authenticated actions', () => {
  it.each([null, { userId: 'b', client: {} }])('rejects stale drafts after logout or owner change', async value => {
    vi.mocked(getAccount).mockResolvedValue(value as typeof account)
    await expect(saveBike(input, 'id', 'a')).rejects.toThrow('Sign in again')
    await expect(loadBikes(false, 'a')).rejects.toThrow('Sign in again')
    await expect(setArchived('id', true, 'a')).rejects.toThrow('Sign in again')
    await expect(deleteBike('id', true, 'a')).rejects.toThrow('Sign in again')
    await expect(importModels(['id'], 'a')).rejects.toThrow('Sign in again')
    expect(repository.addBike).not.toHaveBeenCalled()
  })
  it('dispatches owner-scoped add/edit/archive/list and only confirmed removal', async () => {
    await saveBike(input, 'id', 'a'); await saveBike(input, 'id', 'a', true)
    expect(repository.addBike).toHaveBeenCalledWith(account, input, 'id')
    expect(repository.editBike).toHaveBeenCalledWith(account, 'id', input)
    await loadBikes(true, 'a'); await setArchived('id', true, 'a')
    expect(repository.listBikes).toHaveBeenCalledWith(account, true)
    expect(repository.archiveBike).toHaveBeenCalledWith(account, 'id', true)
    await expect(deleteBike('id', false, 'a')).rejects.toThrow('Confirm removal')
    expect(repository.removeBike).not.toHaveBeenCalled()
    await deleteBike('id', true, 'a')
    expect(repository.removeBike).toHaveBeenCalledWith(account, 'id')
  })
  it('keeps successful imports when an individual model is missing', async () => {
    vi.mocked(repository.importSelectedModels).mockResolvedValueOnce([{ id: 'saved' } as never]).mockRejectedValueOnce(new Error('Missing'))
    expect(await importModels(['valid', 'missing', 'valid'], 'a')).toEqual({ bikes: [{ id: 'saved' }], failed: ['missing'] })
    expect(repository.importSelectedModels).toHaveBeenCalledTimes(2)
  })
})

it.each(['add', 'edit', 'archive', 'remove'])('invalidates collection and bike routes after successful %s only', async operation => {
  const run = { add: () => saveBike(input, 'id', 'a'), edit: () => saveBike(input, 'id', 'a', true), archive: () => setArchived('id', true, 'a'), remove: () => deleteBike('id', true, 'a') }[operation]!
  await run()
  expect(revalidatePath).toHaveBeenCalledWith('/garage')
  expect(revalidatePath).toHaveBeenCalledWith('/garage/id')
})
it('does not invalidate routes for a failed mutation and invalidates successful partial imports', async () => {
  vi.mocked(repository.editBike).mockRejectedValueOnce(new Error('Save failed'))
  await expect(saveBike(input, 'id', 'a', true)).rejects.toThrow('Save failed')
  expect(revalidatePath).not.toHaveBeenCalled()
  vi.mocked(repository.importSelectedModels).mockResolvedValueOnce([{ id: 'imported' } as never]).mockRejectedValueOnce(new Error('Missing'))
  await importModels(['valid', 'missing'], 'a')
  expect(revalidatePath).toHaveBeenCalledWith('/garage')
  expect(revalidatePath).toHaveBeenCalledWith('/garage/imported')
})

import * as jobs from '@/lib/maintenance/jobsRepository.server'
import { jobFixture, bikeFixture } from '@/test/garageFixtures'
import { loadBikeWorkspace, saveQuickJob, correctJob, removeJob } from './actions'
vi.mock('@/lib/maintenance/jobsRepository.server',()=>({listJobs:vi.fn(),getJob:vi.fn(),createQuickJob:vi.fn(),editJobDetails:vi.fn(),deleteJob:vi.fn()}))
it.each([null,{userId:'other',client:{}}])('denies maintenance reads and writes after session or owner changes',async value=>{
 vi.mocked(getAccount).mockResolvedValue(value as typeof account)
 await expect(loadBikeWorkspace(bikeFixture().id,'a')).rejects.toThrow('Sign in again')
 await expect(saveQuickJob(jobFixture(),'a')).rejects.toThrow('Sign in again')
 await expect(correctJob(jobFixture().id,bikeFixture().id,1,jobFixture(),'a')).rejects.toThrow('Sign in again')
 await expect(removeJob(jobFixture().id,bikeFixture().id,true,'a')).rejects.toThrow('Sign in again')
 expect(jobs.createQuickJob).not.toHaveBeenCalled()
})
it('invalidates routes only after successful job saves and uses the authoritative owned bike',async()=>{
 const job=jobFixture();vi.mocked(jobs.createQuickJob).mockResolvedValueOnce({ok:false,error:'save_failed',message:'Failed'}).mockResolvedValueOnce({ok:true,value:job})
 await saveQuickJob(job,'a');expect(revalidatePath).not.toHaveBeenCalled()
 await saveQuickJob(job,'a');expect(jobs.createQuickJob).toHaveBeenCalledWith(account,job);expect(revalidatePath).toHaveBeenCalledWith(`/garage/${job.bikeId}`)
})
it('requires a matching owned bike and explicit removal before correction or deletion',async()=>{
 const job=jobFixture();vi.mocked(jobs.getJob).mockResolvedValue(job)
 await expect(removeJob(job.id,job.bikeId,false,'a')).rejects.toThrow('Confirm removal')
 expect(await correctJob(job.id,'other',1,job,'a')).toMatchObject({ok:false,error:'not_found'})
 expect(await removeJob(job.id,'other',true,'a')).toMatchObject({ok:false,error:'not_found'})
 expect(jobs.editJobDetails).not.toHaveBeenCalled();expect(jobs.deleteJob).not.toHaveBeenCalled()
 vi.mocked(jobs.editJobDetails).mockResolvedValue({ok:true,value:job});await correctJob(job.id,job.bikeId,1,job,'a');expect(jobs.editJobDetails).toHaveBeenCalledWith(account,job.id,1,job)
 vi.mocked(jobs.deleteJob).mockResolvedValue({ok:true,value:null});await removeJob(job.id,job.bikeId,true,'a');expect(jobs.deleteJob).toHaveBeenCalledWith(account,job.id)
})
it('loads only the owned bike and its jobs, including the exact stored mileage',async()=>{
 const bike=bikeFixture({mileageKm:42});vi.mocked(repository.getBike).mockResolvedValue(bike);vi.mocked(jobs.listJobs).mockResolvedValue([jobFixture()])
 expect(await loadBikeWorkspace(bike.id,'a')).toEqual({bike,jobs:[jobFixture()]});expect(repository.getBike).toHaveBeenCalledWith(account,bike.id);expect(jobs.listJobs).toHaveBeenCalledWith(account,bike.id)
 vi.mocked(repository.getBike).mockResolvedValue(null);vi.mocked(jobs.listJobs).mockClear();await expect(loadBikeWorkspace(bike.id,'a')).rejects.toThrow('Bike not found');expect(jobs.listJobs).not.toHaveBeenCalled()
})
