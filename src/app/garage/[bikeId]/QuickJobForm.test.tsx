import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { bikeFixture } from '@/test/garageFixtures'
import type { JobDraft, JobView, SavedResult } from '@/lib/maintenance/types'
import { QuickJobForm } from './QuickJobForm'
const saved = async (draft: JobDraft): Promise<SavedResult<JobView>> => ({ok:true,value:{...draft,revision:1,status:'completed',closeReason:'all_done',closedAt:'2026-10-10T12:00:00Z',createdAt:'2026-10-10T12:00:00Z'}})
function fill() { fireEvent.change(screen.getByLabelText('Work performed'),{target:{value:'Oil changed'}}); fireEvent.change(screen.getByLabelText('Job mileage'),{target:{value:'0'}}) }
it('requires date, mileage and performed work; optional fields start collapsed', async () => {
  const save = vi.fn(saved); render(<QuickJobForm bike={bikeFixture()} onSave={save} />)
  expect(screen.getByLabelText('Job date')).toBeRequired(); expect(screen.getByLabelText('Job mileage')).toBeRequired(); expect(screen.getByLabelText('Work performed')).toBeRequired()
  expect(screen.queryByLabelText('Cost')).not.toBeInTheDocument()
  fill(); fireEvent.click(screen.getByRole('button',{name:'Save entry'})); await waitFor(() => expect(save).toHaveBeenCalledTimes(1))
  expect(save.mock.calls[0][0]).toMatchObject({mileageKm:0,costMinor:null,currency:null,template:null,tasks:[{state:'done',label:'Oil changed'}]})
})
it.each(['-1','Infinity','1.234','900719925474099.99'])('rejects invalid cost %s before saving', async cost => {
  const save=vi.fn(saved); render(<QuickJobForm bike={bikeFixture()} onSave={save} />); fill(); fireEvent.click(screen.getByRole('button',{name:'Optional details'})); fireEvent.change(screen.getByLabelText('Cost'),{target:{value:cost}}); fireEvent.submit(screen.getByRole('button',{name:'Save entry'}).closest('form')!); expect((await screen.findAllByRole('alert')).length).toBeGreaterThan(0); expect(save).not.toHaveBeenCalled()
})
it('saves zero cost and converts miles once', async () => {
 const save=vi.fn(saved); render(<QuickJobForm bike={bikeFixture()} onSave={save} />); fill(); fireEvent.click(screen.getByRole('radio',{name:'Miles'})); fireEvent.change(screen.getByLabelText('Job mileage'),{target:{value:'1000'}}); fireEvent.click(screen.getByRole('button',{name:'Optional details'})); fireEvent.change(screen.getByLabelText('Cost'),{target:{value:'0'}}); fireEvent.click(screen.getByRole('button',{name:'Save entry'})); await waitFor(()=>expect(save).toHaveBeenCalledTimes(1)); expect(save.mock.calls[0][0]).toMatchObject({mileageKm:1609.344,costMinor:0,currency:'EUR'})
})
it('retains failed drafts and identifiers; blocks duplicate submits', async () => {
 let finish!: (result:SavedResult<JobView>)=>void; const save=vi.fn((draft:JobDraft) => { expect(draft.bikeId).toBe(bikeFixture().id); return new Promise<SavedResult<JobView>>(resolve=>{finish=resolve}) }); render(<QuickJobForm bike={bikeFixture()} onSave={save} />); fill(); const form=screen.getByRole('button',{name:'Save entry'}).closest('form')!; fireEvent.submit(form); fireEvent.submit(form); expect(save).toHaveBeenCalledTimes(1); expect(screen.getByRole('button',{name:'Saving…'})).toBeDisabled(); await act(async()=>finish({ok:false,error:'save_failed',message:'Sign in again'})); expect(screen.getByLabelText('Work performed')).toHaveValue('Oil changed'); fireEvent.submit(form); expect(save.mock.calls[1][0]).toEqual(save.mock.calls[0][0])
})

import { JobDetailsForm } from './QuickJobForm'
import { jobFixture } from '@/test/garageFixtures'
it('switches units on a loaded correction without converting kilometres twice',async()=>{
 const save=vi.fn(async(details)=>({ok:true as const,value:{...jobFixture(),...details}}));render(<JobDetailsForm job={jobFixture({mileageKm:12000})} onSave={save} />)
 fireEvent.click(screen.getByRole('radio',{name:'Miles'}));expect(Number((screen.getByLabelText('Job mileage') as HTMLInputElement).value)).toBeCloseTo(7456.45,1)
 fireEvent.click(screen.getByRole('button',{name:'Save correction'}));fireEvent.click(screen.getByRole('button',{name:'Confirm correction'}));await waitFor(()=>expect(save).toHaveBeenCalledTimes(1));expect(save.mock.calls[0][0].mileageKm).toBe(12000)
})
it('uses a local calendar date by default',()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date(2026,9,10,12));render(<QuickJobForm bike={bikeFixture()} onSave={saved} />);expect(screen.getByLabelText('Job date')).toHaveValue('2026-10-10');vi.useRealTimers()
})
it.each([{title:'',date:'2026-10-10',mileage:'0'},{title:'Work',date:'',mileage:'0'},{title:'Work',date:'2026-10-10',mileage:''},{title:'Work',date:'2026-10-10',mileage:'-1'},{title:'Work',date:'2026-10-10',mileage:'Infinity'}])('rejects missing or invalid required values %j',async values=>{
 const save=vi.fn(saved);render(<QuickJobForm bike={bikeFixture()} onSave={save} />)
 fireEvent.change(screen.getByLabelText('Work performed'),{target:{value:values.title}});fireEvent.change(screen.getByLabelText('Job date'),{target:{value:values.date}});fireEvent.change(screen.getByLabelText('Job mileage'),{target:{value:values.mileage}});fireEvent.submit(screen.getByRole('button',{name:'Save entry'}).closest('form')!);expect((await screen.findAllByRole('alert')).length).toBeGreaterThan(0);expect(save).not.toHaveBeenCalled()
})
it('keeps entered optional values after thrown session failure',async()=>{
 const save=vi.fn().mockRejectedValue(new Error('Sign in again'));render(<QuickJobForm bike={bikeFixture()} onSave={save} />);fill();fireEvent.click(screen.getByRole('button',{name:'Optional details'}));fireEvent.change(screen.getByLabelText('Notes'),{target:{value:'<b>private</b>'}});fireEvent.change(screen.getByLabelText('Parts'),{target:{value:'Filter'}});fireEvent.change(screen.getByLabelText('Performed by'),{target:{value:'Owner'}});fireEvent.change(screen.getByLabelText('Cost'),{target:{value:'42.50'}});fireEvent.change(screen.getByLabelText('Currency'),{target:{value:'GBP'}});fireEvent.click(screen.getByRole('button',{name:'Save entry'}));expect(await screen.findByRole('alert')).toHaveTextContent('Sign in again');expect(screen.getByLabelText('Notes')).toHaveValue('<b>private</b>');expect(save.mock.calls[0][0]).toMatchObject({notes:'<b>private</b>',parts:'Filter',performer:'Owner',costMinor:4250,currency:'GBP'})
})
it('preserves every minor unit when editing a large valid cost',()=>{
 render(<JobDetailsForm job={jobFixture({costMinor:Number.MAX_SAFE_INTEGER-1,currency:'USD'})} onSave={vi.fn()} />);fireEvent.click(screen.getByRole('button',{name:'Optional details'}));expect(screen.getByLabelText('Cost')).toHaveValue('90071992547409.90')
})

it.each(['Kilometres','Miles'])('keeps quick-entry mileage unchanged when clicking selected %s',async unit=>{
 const save=vi.fn(saved);render(<QuickJobForm bike={bikeFixture()} onSave={save} />);fill()
 if(unit==='Miles') fireEvent.click(screen.getByRole('radio',{name:'Miles'}))
 fireEvent.change(screen.getByLabelText('Job mileage'),{target:{value:'100'}})
 fireEvent.click(screen.getByRole('radio',{name:unit}));fireEvent.click(screen.getByRole('radio',{name:unit}))
 expect(screen.getByLabelText('Job mileage')).toHaveValue('100')
 fireEvent.click(screen.getByRole('button',{name:'Save entry'}));await waitFor(()=>expect(save).toHaveBeenCalledTimes(1));expect(save.mock.calls[0][0].mileageKm).toBe(unit==='Miles'?160.934:100)
})
it.each(['Kilometres','Miles'])('keeps a loaded correction unchanged when clicking selected %s',async unit=>{
 const save=vi.fn(async details=>({ok:true as const,value:{...jobFixture(),...details}}));render(<JobDetailsForm job={jobFixture({mileageKm:100})} onSave={save} />)
 if(unit==='Miles') fireEvent.click(screen.getByRole('radio',{name:'Miles'}))
 const original=(screen.getByLabelText('Job mileage') as HTMLInputElement).value
 fireEvent.click(screen.getByRole('radio',{name:unit}));fireEvent.click(screen.getByRole('radio',{name:unit}))
 expect(screen.getByLabelText('Job mileage')).toHaveValue(original)
 fireEvent.click(screen.getByRole('button',{name:'Save correction'}));fireEvent.click(screen.getByRole('button',{name:'Confirm correction'}));await waitFor(()=>expect(save).toHaveBeenCalledTimes(1));expect(save.mock.calls[0][0].mileageKm).toBe(100)
})
it('uses the start transaction only after an explicit carry choice and retains failed choices',async()=>{
 const {jobFixture}=await import('@/test/garageFixtures')
 const previous=jobFixture();const save=vi.fn(saved);const start=vi.fn().mockResolvedValue({ok:false,error:'conflict',message:'Previous activity changed'})
 const {rerender}=render(<QuickJobForm bike={bikeFixture()} previous={previous} onSave={save} onStart={start} />)
 fill();fireEvent.click(screen.getByRole('button',{name:'Carry unfinished work'}))
 fireEvent.click(screen.getByLabelText('Inspect chain'));fireEvent.click(screen.getByLabelText('Complete previous activity'))
 fireEvent.click(screen.getByRole('button',{name:'Save entry'}));expect(await screen.findByRole('alert')).toHaveTextContent('Previous activity changed')
 expect(save).not.toHaveBeenCalled();expect(start.mock.calls[0][0].tasks[0].state).toBe('done')
 expect(start.mock.calls[0][1]).toMatchObject({sourceJobId:previous.id,sourceRevision:1,taskIds:[previous.tasks[0].id],closePrevious:true})
 rerender(<QuickJobForm bike={bikeFixture()} previous={jobFixture({id:'new-source',title:'Another source'})} onSave={save} onStart={start} />)
 expect(screen.getByLabelText('Inspect chain')).toBeChecked();expect(screen.getByLabelText('Complete previous activity')).toBeChecked()
 fireEvent.click(screen.getByRole('button',{name:'Save entry'}));await waitFor(()=>expect(start).toHaveBeenCalledTimes(2));expect(start.mock.calls[1]).toEqual(start.mock.calls[0])
})
it('leaves the existing quick flow unchanged without selected carry or closure',async()=>{
 const {jobFixture}=await import('@/test/garageFixtures');const save=vi.fn(saved),start=vi.fn()
 render(<QuickJobForm bike={bikeFixture()} previous={jobFixture()} onSave={save} onStart={start} />)
 fill();fireEvent.click(screen.getByRole('button',{name:'Carry unfinished work'}))
 expect(save).not.toHaveBeenCalled();expect(start).not.toHaveBeenCalled()
 fireEvent.click(screen.getByRole('button',{name:'Save entry'}));await waitFor(()=>expect(save).toHaveBeenCalledTimes(1));expect(start).not.toHaveBeenCalled()
})
it('submits a previous closure alone through the transaction',async()=>{
 const {jobFixture}=await import('@/test/garageFixtures');const save=vi.fn(saved),start=vi.fn(async(draft:JobDraft)=>saved(draft))
 render(<QuickJobForm bike={bikeFixture()} previous={jobFixture()} onSave={save} onStart={start} />)
 fill();fireEvent.click(screen.getByRole('button',{name:'Carry unfinished work'}));fireEvent.click(screen.getByLabelText('Complete previous activity'))
 fireEvent.click(screen.getByRole('button',{name:'Save entry'}));await waitFor(()=>expect(start).toHaveBeenCalledTimes(1))
 expect(start.mock.calls[0]).toMatchObject([expect.objectContaining({tasks:[expect.objectContaining({state:'done'})]}),{taskIds:[],closePrevious:true}]);expect(save).not.toHaveBeenCalled()
})

it('refreshes a conflicted source without writes or lost draft and requires fresh choices',async()=>{
 const {jobFixture,taskFixture}=await import('@/test/garageFixtures')
 const previous=jobFixture(),fresh=jobFixture({id:'00000000-0000-4000-8000-000000000008',revision:2,title:'Refreshed service',tasks:[taskFixture({state:'done',doneAt:'2026-10-10T00:00:00Z'}),taskFixture({id:'00000000-0000-4000-8000-000000000009',label:'New outstanding task'})]})
 const save=vi.fn(saved),reload=vi.fn().mockResolvedValue(fresh)
 const start=vi.fn().mockResolvedValueOnce({ok:false,error:'conflict',message:'Previous activity changed'}).mockImplementationOnce(async(draft:JobDraft)=>saved(draft))
 render(<QuickJobForm bike={bikeFixture()} previous={previous} onSave={save} onStart={start} onReloadPrevious={reload} />)
 fill();fireEvent.click(screen.getByRole('button',{name:'Carry unfinished work'}));fireEvent.click(screen.getByLabelText('Inspect chain'));fireEvent.click(screen.getByLabelText('Complete previous activity'))
 fireEvent.click(screen.getByRole('button',{name:'Save entry'}));await screen.findByRole('alert')
 const original=start.mock.calls[0][0]
 fireEvent.click(screen.getByRole('button',{name:'Reload previous activity'}));await waitFor(()=>expect(reload).toHaveBeenCalledTimes(1))
 expect(start).toHaveBeenCalledTimes(1);expect(save).not.toHaveBeenCalled();expect(screen.getByLabelText('Work performed')).toHaveValue('Oil changed');expect(screen.getByLabelText('Job mileage')).toHaveValue('0')
 fireEvent.click(screen.getByRole('button',{name:'Carry unfinished work'}));expect(screen.getByRole('status')).toHaveTextContent('Previous activity reloaded: Refreshed service.');expect(screen.getByRole('status')).toHaveTextContent('Carry choices were cleared.');expect(screen.queryByLabelText('Inspect chain')).toBeNull()
 expect(screen.getByLabelText('New outstanding task')).not.toBeChecked();expect(screen.getByLabelText('Complete previous activity')).not.toBeChecked()
 fireEvent.click(screen.getByLabelText('New outstanding task'));fireEvent.click(screen.getByLabelText('Complete previous activity'))
 fireEvent.click(screen.getByRole('button',{name:'Save entry'}));await waitFor(()=>expect(start).toHaveBeenCalledTimes(2))
 expect(start.mock.calls[1][0]).toEqual(original);expect(start.mock.calls[1][1]).toMatchObject({sourceJobId:fresh.id,sourceRevision:2,taskIds:[fresh.tasks[1].id],closePrevious:true})
})
it('retains choices and fields when source refresh fails and blocks saves during refresh',async()=>{
 const {jobFixture}=await import('@/test/garageFixtures')
 let finish!:(job:JobView|null)=>void
 const reload=vi.fn().mockRejectedValueOnce(new Error('Sign in again to reload')).mockImplementationOnce(()=>new Promise<JobView|null>(resolve=>{finish=resolve}))
 const start=vi.fn().mockResolvedValue({ok:false,error:'conflict',message:'Previous activity changed'}),save=vi.fn(saved)
 render(<QuickJobForm bike={bikeFixture()} previous={jobFixture()} onSave={save} onStart={start} onReloadPrevious={reload} />)
 fill();fireEvent.click(screen.getByRole('button',{name:'Carry unfinished work'}));fireEvent.click(screen.getByLabelText('Inspect chain'))
 fireEvent.click(screen.getByRole('button',{name:'Save entry'}));await screen.findByRole('alert')
 fireEvent.click(screen.getByRole('button',{name:'Reload previous activity'}));await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('Sign in again to reload'))
 expect(screen.getByLabelText('Inspect chain')).toBeChecked();expect(screen.getByLabelText('Work performed')).toHaveValue('Oil changed')
 fireEvent.click(screen.getByRole('button',{name:'Reload previous activity'}))
 expect(screen.getByRole('button',{name:'Refreshing…'})).toBeDisabled()
 fireEvent.submit(screen.getByRole('button',{name:'Refreshing…'}).closest('form')!)
 expect(start).toHaveBeenCalledTimes(1);expect(save).not.toHaveBeenCalled()
 await act(async()=>finish(null))
 expect(screen.queryByRole('button',{name:'Carry unfinished work'})).toBeNull();expect(screen.queryByRole('alert')).toBeNull();expect(screen.getByLabelText('Work performed')).toHaveValue('Oil changed')
})

it('associates validation failures with the invalid fields',()=>{
 render(<QuickJobForm bike={bikeFixture()} onSave={vi.fn()} />)
 fireEvent.change(screen.getByLabelText('Work performed'),{target:{value:' '}})
 fireEvent.change(screen.getByLabelText('Job mileage'),{target:{value:'bad'}})
 fireEvent.click(screen.getByRole('button',{name:'Optional details'}))
 fireEvent.change(screen.getByLabelText('Cost'),{target:{value:'1.234'}})
 fireEvent.submit(screen.getByRole('button',{name:'Save entry'}).closest('form')!)
 for(const label of ['Work performed','Job mileage','Cost']) {
  const input=screen.getByLabelText(label)
  expect(input).toHaveAttribute('aria-invalid','true')
  expect(document.getElementById(input.getAttribute('aria-describedby')!)).toHaveAttribute('role','alert')
 }
})
