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
  const save=vi.fn(saved); render(<QuickJobForm bike={bikeFixture()} onSave={save} />); fill(); fireEvent.click(screen.getByRole('button',{name:'Optional details'})); fireEvent.change(screen.getByLabelText('Cost'),{target:{value:cost}}); fireEvent.submit(screen.getByRole('button',{name:'Save entry'}).closest('form')!); expect(await screen.findByRole('alert')).toBeInTheDocument(); expect(save).not.toHaveBeenCalled()
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
 fireEvent.change(screen.getByLabelText('Work performed'),{target:{value:values.title}});fireEvent.change(screen.getByLabelText('Job date'),{target:{value:values.date}});fireEvent.change(screen.getByLabelText('Job mileage'),{target:{value:values.mileage}});fireEvent.submit(screen.getByRole('button',{name:'Save entry'}).closest('form')!);expect(await screen.findByRole('alert')).toBeInTheDocument();expect(save).not.toHaveBeenCalled()
})
it('keeps entered optional values after thrown session failure',async()=>{
 const save=vi.fn().mockRejectedValue(new Error('Sign in again'));render(<QuickJobForm bike={bikeFixture()} onSave={save} />);fill();fireEvent.click(screen.getByRole('button',{name:'Optional details'}));fireEvent.change(screen.getByLabelText('Notes'),{target:{value:'<b>private</b>'}});fireEvent.change(screen.getByLabelText('Parts'),{target:{value:'Filter'}});fireEvent.change(screen.getByLabelText('Performed by'),{target:{value:'Owner'}});fireEvent.change(screen.getByLabelText('Cost'),{target:{value:'42.50'}});fireEvent.change(screen.getByLabelText('Currency'),{target:{value:'GBP'}});fireEvent.click(screen.getByRole('button',{name:'Save entry'}));expect(await screen.findByRole('alert')).toHaveTextContent('Sign in again');expect(screen.getByLabelText('Notes')).toHaveValue('<b>private</b>');expect(save.mock.calls[0][0]).toMatchObject({notes:'<b>private</b>',parts:'Filter',performer:'Owner',costMinor:4250,currency:'GBP'})
})
it('preserves every minor unit when editing a large valid cost',()=>{
 render(<JobDetailsForm job={jobFixture({costMinor:Number.MAX_SAFE_INTEGER-1,currency:'USD'})} onSave={vi.fn()} />);fireEvent.click(screen.getByRole('button',{name:'Optional details'}));expect(screen.getByLabelText('Cost')).toHaveValue('90071992547409.90')
})
