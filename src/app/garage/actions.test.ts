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
beforeEach(() => { vi.clearAllMocks(); vi.mocked(getAccount).mockResolvedValue(account);vi.mocked(listPrivateFiles).mockResolvedValue([]);vi.mocked(cleanupOwnedFiles).mockResolvedValue(undefined) })
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
import { startMaintenanceJob, loadBikeWorkspace, saveQuickJob, correctJob, removeJob } from './actions'
vi.mock('@/lib/maintenance/jobsRepository.server',()=>({startJob:vi.fn(),listJobs:vi.fn(),getJob:vi.fn(),createQuickJob:vi.fn(),editJobDetails:vi.fn(),deleteJob:vi.fn()}))
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
 expect(await loadBikeWorkspace(bike.id,'a')).toEqual({bike,jobs:[jobFixture()],files:[]});expect(repository.getBike).toHaveBeenCalledWith(account,bike.id);expect(jobs.listJobs).toHaveBeenCalledWith(account,bike.id)
 vi.mocked(repository.getBike).mockResolvedValue(null);vi.mocked(jobs.listJobs).mockClear();await expect(loadBikeWorkspace(bike.id,'a')).rejects.toThrow('Bike not found');expect(jobs.listJobs).not.toHaveBeenCalled()
})

import {cleanupOwnedFiles,listPrivateFiles} from '@/lib/maintenance/uploads.server'
vi.mock('@/lib/maintenance/uploads.server',()=>({cleanupOwnedFiles:vi.fn(),listPrivateFiles:vi.fn(async()=>[])}))
it('keeps bikes and jobs when Storage cleanup fails so removal can be retried',async()=>{
 vi.mocked(cleanupOwnedFiles).mockRejectedValueOnce(new Error('Cleanup failed; retry'))
 await expect(deleteBike(bikeFixture().id,true,'a')).rejects.toThrow('Cleanup failed; retry')
 expect(repository.removeBike).not.toHaveBeenCalled()
 vi.mocked(jobs.getJob).mockResolvedValue(jobFixture());vi.mocked(cleanupOwnedFiles).mockRejectedValueOnce(new Error('Cleanup failed; retry'))
 expect(await removeJob(jobFixture().id,bikeFixture().id,true,'a')).toMatchObject({ok:false,error:'save_failed',message:'Cleanup failed; retry'})
 expect(jobs.deleteJob).not.toHaveBeenCalled()
})
it('reconciles owned photos and receipt metadata with the workspace',async()=>{
 vi.mocked(repository.getBike).mockResolvedValue(bikeFixture({photoPath:'new.webp'}));vi.mocked(jobs.listJobs).mockResolvedValue([jobFixture()]);vi.mocked(listPrivateFiles).mockResolvedValue([{id:'receipt',bikeId:bikeFixture().id,jobId:jobFixture().id,kind:'receipt',path:'file.pdf',filename:'receipt.pdf',cleanupPending:false}])
 const fresh=await loadBikeWorkspace(bikeFixture().id,'a');expect(fresh).toMatchObject({bike:{photoPath:'new.webp'},files:[{id:'receipt'}]})
})

it.each([null,{userId:'other',client:{}}])('denies carry creation after owner/session changes',async value=>{
 vi.mocked(getAccount).mockResolvedValue(value as typeof account)
 await expect(startMaintenanceJob(jobFixture(),null,'a')).rejects.toThrow('Sign in again')
 expect(jobs.startJob).not.toHaveBeenCalled()
})
it('dispatches carry choices and invalidates only the saved bike after success',async()=>{
 const job=jobFixture(),carry={sourceJobId:job.id,sourceRevision:1,taskIds:[],closePrevious:true}
 vi.mocked(jobs.startJob).mockResolvedValueOnce({ok:false,error:'conflict',message:'Changed'}).mockResolvedValueOnce({ok:true,value:job})
 await startMaintenanceJob(job,carry,'a');expect(revalidatePath).not.toHaveBeenCalled()
 await startMaintenanceJob(job,carry,'a');expect(jobs.startJob).toHaveBeenCalledWith(account,job,carry)
 expect(revalidatePath).toHaveBeenCalledWith(`/garage/${job.bikeId}`)
})

import { loadTemplates, savePersonalTemplate, startTemplateMaintenance } from './actions'
import { templateFixture } from '@/test/garageFixtures'
import { combineTemplates } from '@/lib/maintenance/templateValidation'
import * as templates from '@/lib/maintenance/templates'
vi.mock('@/lib/maintenance/templates',()=>({listTemplates:vi.fn(),saveCustomTemplate:vi.fn()}))
it('rejects template drafts from a previous account',async()=>{
 vi.mocked(getAccount).mockResolvedValue({userId:'b',client:{}} as typeof account)
 await expect(loadTemplates(bikeFixture().id,'a')).rejects.toThrow('Sign in again')
 await expect(savePersonalTemplate(templateFixture(),'a')).rejects.toThrow('Sign in again')
 await expect(startTemplateMaintenance(jobFixture(),['template'],null,'a')).rejects.toThrow('Sign in again')
 expect(templates.saveCustomTemplate).not.toHaveBeenCalled()
})
it('resolves selected definitions and additions from owned server templates and resets task state',async()=>{
 const first=templateFixture(),addition=templateFixture({id:'time',kind:'time_based',tasks:[{...templateFixture().tasks[0],key:'fluid:replace',label:'Replace fluid',action:'replace',reference:'Source page 70'}]})
 vi.mocked(repository.getBike).mockResolvedValue(bikeFixture());vi.mocked(templates.listTemplates).mockResolvedValue([first,addition]);vi.mocked(jobs.startJob).mockResolvedValue({ok:true,value:jobFixture()})
 const snapshot=combineTemplates([first,addition]);const draft=jobFixture({template:snapshot,tasks:[{...jobFixture().tasks[0],state:'done',doneAt:'2026-10-10T10:00:00Z'},{...jobFixture().tasks[0],id:crypto.randomUUID(),notes:'injected'}]})
 await startTemplateMaintenance(draft,[first.id,addition.id],null,'a')
 const passed=vi.mocked(jobs.startJob).mock.calls[0][1]
 expect(passed.tasks).toHaveLength(2);expect(passed.tasks.every(t=>t.state==='todo'&&t.notes===''&&t.doneAt===null)).toBe(true)
 expect(passed.tasks[1].reference).toBe('Source page 70');expect(passed.template?.tasks[1].action).toBe('replace')
})
it('blocks missing coverage and changed template snapshots before creating jobs',async()=>{
 vi.mocked(repository.getBike).mockResolvedValue(bikeFixture());vi.mocked(templates.listTemplates).mockResolvedValue([])
 expect(await startTemplateMaintenance(jobFixture(),['missing'],null,'a')).toMatchObject({ok:false,error:'invalid'})
 vi.mocked(templates.listTemplates).mockResolvedValue([templateFixture()])
 expect(await startTemplateMaintenance(jobFixture({template:templateFixture({version:2})}),[templateFixture().id],null,'a')).toMatchObject({ok:false,error:'conflict'})
 expect(jobs.startJob).not.toHaveBeenCalled()
})
