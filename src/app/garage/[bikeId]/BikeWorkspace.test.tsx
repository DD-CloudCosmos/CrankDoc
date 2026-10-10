import { it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import type { BikeView } from '@/lib/garageBikes'
import { BikeWorkspace } from './BikeWorkspace'
const actions = vi.hoisted(() => ({ saveBike: vi.fn(), loadBikes: vi.fn(), setArchived: vi.fn(), deleteBike: vi.fn(), importModels: vi.fn(), loadBikeWorkspace: vi.fn(), saveQuickJob: vi.fn(), correctJob: vi.fn(), removeJob: vi.fn() }))
vi.mock('../actions', () => actions)
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
const bike: BikeView = { id: 'one', motorcycleId: null, nickname: 'Weekend bike', make: 'Honda', model: 'Custom', year: null, variant: '', market: '', registration: 'PRIVATE', mileageKm: null, archivedAt: null, photoPath: null, libraryImageUrl: null, modelReferenceUrl: null }
beforeEach(() => vi.resetAllMocks())
  it('requires explicit confirmation before removal', async () => {
    actions.deleteBike.mockResolvedValue(undefined)
    render(<BikeWorkspace bike={bike} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Bike details' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove bike' }))
    expect(actions.deleteBike).not.toHaveBeenCalled()
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel removal' }))
    expect(actions.deleteBike).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Remove bike' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm removal' }))
    await waitFor(() => expect(actions.deleteBike).toHaveBeenCalledTimes(1))
  })

  it('does not invent maintenance or reference for custom bikes', () => {
    render(<BikeWorkspace bike={bike} />)
    expect(screen.getAllByText('No maintenance recorded').some(element=>!element.closest('[hidden]'))).toBe(true)
    expect(screen.getByText(/Reference unavailable/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: 'Maintenance' }))
    expect(screen.getByRole('button', { name: 'Log maintenance' })).toBeInTheDocument()
  })
it('restores archived bikes without removing their records', async () => {
  actions.setArchived.mockResolvedValue(undefined)
  render(<BikeWorkspace bike={{ ...bike, archivedAt: '2026-10-10' }} />)
  fireEvent.click(screen.getByRole('radio', { name: 'Bike details' }))
  fireEvent.click(screen.getByRole('button', { name: 'Restore bike' }))
  await waitFor(() => expect(actions.setArchived).toHaveBeenCalledWith('one', false, expect.anything()))
  expect(actions.deleteBike).not.toHaveBeenCalled()
  await waitFor(() => expect(screen.getByRole('button', { name: 'Archive bike' })).toBeInTheDocument())
})

it.each([false, true])('keeps an unsaved Details draft across tabs, including failed saves (%s)', async fail => {
  if (fail) actions.saveBike.mockRejectedValueOnce(new Error('Save failed'))
  render(<BikeWorkspace bike={bike} />)
  fireEvent.click(screen.getByRole('radio', { name: 'Bike details' }))
  fireEvent.change(screen.getByLabelText('Nickname'), { target: { value: 'Unsaved nickname' } })
  fireEvent.change(screen.getByLabelText('Mileage'), { target: { value: '321' } })
  if (fail) {
    fireEvent.click(screen.getByRole('button', { name: 'Save bike' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Save failed')
  }
  fireEvent.click(screen.getByRole('radio', { name: 'Overview' }))
  fireEvent.click(screen.getByRole('radio', { name: 'Maintenance' }))
  fireEvent.click(screen.getByRole('radio', { name: 'Bike details' }))
  expect(screen.getByLabelText('Nickname')).toHaveValue('Unsaved nickname')
  expect(screen.getByLabelText('Mileage')).toHaveValue(321)
  if (fail) expect(screen.getByRole('alert')).toHaveTextContent('Save failed')
})
it('coordinates pending saves and archives so later completion cannot overwrite edited values', async () => {
  let save!: (value: BikeView) => void
  let archive!: () => void
  actions.saveBike.mockImplementationOnce(() => new Promise(done => { save = done }))
  actions.setArchived.mockImplementationOnce(() => new Promise<void>(done => { archive = done }))
  render(<BikeWorkspace bike={bike} />)
  fireEvent.click(screen.getByRole('radio', { name: 'Bike details' }))
  fireEvent.change(screen.getByLabelText('Nickname'), { target: { value: 'Edited nickname' } })
  fireEvent.change(screen.getByLabelText('Mileage'), { target: { value: '456' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save bike' }))
  await waitFor(() => expect(actions.saveBike).toHaveBeenCalledTimes(1))
  expect(screen.getByRole('button', { name: 'Archive bike' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Archive bike' }))
  expect(actions.setArchived).not.toHaveBeenCalled()
  await act(async () => save({ ...bike, nickname: 'Edited nickname', mileageKm: 456 }))
  fireEvent.click(screen.getByRole('button', { name: 'Archive bike' }))
  await waitFor(() => expect(actions.setArchived).toHaveBeenCalledTimes(1))
  expect(screen.getByRole('button', { name: 'Save bike' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Save bike' }))
  expect(actions.saveBike).toHaveBeenCalledTimes(1)
  await act(async () => archive())
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Edited nickname')
  fireEvent.click(screen.getByRole('radio', { name: 'Overview' }))
  expect(screen.getByText('456 km')).toBeInTheDocument()
  expect(screen.getByText('Archived bike')).toBeInTheDocument()
})

import { jobFixture } from '@/test/garageFixtures'
it('keeps quick drafts across tabs and refreshes authoritative mileage after an idempotent save',async()=>{
 actions.saveQuickJob.mockResolvedValue({ok:true,value:jobFixture({bikeId:bike.id,status:'completed'})});actions.loadBikeWorkspace.mockResolvedValue({bike:{...bike,mileageKm:250},jobs:[jobFixture({bikeId:bike.id,status:'completed'})]})
 render(<BikeWorkspace bike={bike} />);fireEvent.click(screen.getByRole('radio',{name:'Maintenance'}));fireEvent.click(screen.getByRole('button',{name:'Log maintenance'}));fireEvent.change(screen.getByLabelText('Work performed'),{target:{value:'Oil'}});fireEvent.change(screen.getByLabelText('Job mileage'),{target:{value:'12000'}});fireEvent.click(screen.getByRole('radio',{name:'Overview'}));fireEvent.click(screen.getByRole('radio',{name:'Maintenance'}));expect(screen.getByLabelText('Work performed')).toHaveValue('Oil');fireEvent.click(screen.getByRole('button',{name:'Save entry'}));await waitFor(()=>expect(actions.loadBikeWorkspace).toHaveBeenCalled());fireEvent.click(screen.getByRole('radio',{name:'Overview'}));expect(screen.getByText('250 km')).toBeInTheDocument()
})
it('reconciles fresh props without replacing a dirty quick draft',()=>{
 const {rerender}=render(<BikeWorkspace bike={bike} />);fireEvent.click(screen.getByRole('radio',{name:'Maintenance'}));fireEvent.click(screen.getByRole('button',{name:'Log maintenance'}));fireEvent.change(screen.getByLabelText('Work performed'),{target:{value:'Unsaved'}});rerender(<BikeWorkspace bike={{...bike,mileageKm:99}} />);expect(screen.getByLabelText('Work performed')).toHaveValue('Unsaved');fireEvent.click(screen.getByRole('radio',{name:'Overview'}));expect(screen.getByText('99 km')).toBeInTheDocument()
})
it('retains the saved record if the follow-up read fails and does not guess mileage',async()=>{
 const job=jobFixture({bikeId:bike.id,title:'Saved oil change',status:'completed'});actions.saveQuickJob.mockResolvedValue({ok:true,value:job});actions.loadBikeWorkspace.mockRejectedValue(new Error('Network unavailable'));render(<BikeWorkspace bike={{...bike,mileageKm:50}} />);fireEvent.click(screen.getByRole('radio',{name:'Maintenance'}));fireEvent.click(screen.getByRole('button',{name:'Log maintenance'}));fireEvent.change(screen.getByLabelText('Work performed'),{target:{value:'Oil'}});fireEvent.change(screen.getByLabelText('Job mileage'),{target:{value:'12000'}});fireEvent.click(screen.getByRole('button',{name:'Save entry'}));expect(await screen.findByRole('alert')).toHaveTextContent('Record saved');expect(screen.getByRole('button',{name:'Show record: Saved oil change'})).toBeInTheDocument();fireEvent.click(screen.getByRole('radio',{name:'Overview'}));expect(screen.getByText('50 km')).toBeInTheDocument()
})

import {uploadPrivateFile} from '@/lib/maintenance/uploads'
vi.mock('@/lib/maintenance/uploads',()=>({uploadPrivateFile:vi.fn(),privateFileRequest:vi.fn(async()=>({url:'https://local.invalid/photo',expiresIn:60}))}))
vi.mock('@/lib/supabase/auth-browser',()=>({createAuthBrowserClient:()=>({auth:{onAuthStateChange:()=>({data:{subscription:{unsubscribe:vi.fn()}}})}})}))
it('reconciles a saved photo and receipt list without remounting dirty details',async()=>{
 const job=jobFixture({bikeId:bike.id,status:'completed'});const photoPath='owner/bikes/one/file.webp'
 actions.loadBikeWorkspace.mockResolvedValue({bike:{...bike,photoPath},jobs:[job],files:[{id:'receipt',bikeId:bike.id,jobId:job.id,kind:'receipt',path:'receipt.pdf',filename:'saved receipt.pdf',cleanupPending:false}]})
 vi.mocked(uploadPrivateFile).mockResolvedValue({id:'photo',path:photoPath});vi.stubGlobal('URL',Object.assign(URL,{createObjectURL:vi.fn(()=> 'blob:preview'),revokeObjectURL:vi.fn()}))
 render(<BikeWorkspace bike={bike} jobs={[job]} />);fireEvent.click(screen.getByRole('radio',{name:'Bike details'}));fireEvent.change(screen.getByLabelText('Nickname'),{target:{value:'Still unsaved'}})
 fireEvent.click(screen.getByRole('button',{name:'Edit image'}));fireEvent.change(screen.getByLabelText('Choose bike photo'),{target:{files:[new File(['jpg'],'bike.jpg',{type:'image/jpeg'})]}});fireEvent.click(screen.getByRole('button',{name:'Save image'}));await waitFor(()=>expect(actions.loadBikeWorkspace).toHaveBeenCalled())
 expect(screen.getByLabelText('Nickname')).toHaveValue('Still unsaved');fireEvent.click(screen.getByRole('radio',{name:'Maintenance'}));fireEvent.click(screen.getByRole('button',{name:`Show record: ${job.title}`}));expect(screen.getByText('saved receipt.pdf')).toBeInTheDocument()
})
it('exposes owner record downloads within bike maintenance, including archived bikes',()=>{
 render(<BikeWorkspace bike={{...bike,archivedAt:'2026-10-10'}} />)
 fireEvent.click(screen.getByRole('radio',{name:'Maintenance'}))
 expect(screen.getByText('Export records')).toBeInTheDocument()
 expect(screen.getByRole('link',{name:'Download JSON'})).toHaveAttribute('href','/api/garage/export?bikeId=one&format=json')
 expect(screen.getByRole('link',{name:'Download CSV'})).toHaveAttribute('href','/api/garage/export?bikeId=one&format=csv')
})
it('offers catalogue relinking in details while saving the same physical bike',async()=>{
 const model={id:'00000000-0000-4000-8000-000000000002',make:'Yamaha',model:'MT-07',year_start:2020,year_end:2024}
 actions.saveBike.mockResolvedValue({...bike,motorcycleId:model.id,make:model.make,model:model.model})
 render(<BikeWorkspace bike={bike} models={[model]} />)
 fireEvent.click(screen.getByRole('radio',{name:'Bike details'}))
 fireEvent.click(screen.getByRole('button',{name:'Change model'}))
 fireEvent.change(screen.getByLabelText('Model from the library'),{target:{value:model.id}})
 fireEvent.click(screen.getByRole('button',{name:'Save bike'}))
 await waitFor(()=>expect(actions.saveBike).toHaveBeenCalledWith(expect.objectContaining({motorcycleId:model.id,make:model.make,model:model.model}),bike.id,'',true))
})
