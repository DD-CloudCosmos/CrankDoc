import { expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { bikeFixture, jobFixture, taskFixture, templateFixture } from '@/test/garageFixtures'
import { PrintChecklist, BlankPrintChecklist } from './PrintChecklist'
it('prints recorded states, reasons, notes, origins and source without writing',()=>{
 const print=vi.spyOn(window,'print').mockImplementation(()=>{})
 const job=jobFixture({template:templateFixture({version:3}),notes:'Job observation',tasks:['todo','done','skipped','not_applicable'].map((state,i)=>taskFixture({id:String(i),state:state as never,label:`Task ${i}`,reason:i>1?'Parts unavailable':'',notes:i===0?'Observation does not mean done':'',origin:i===1?{jobId:'prior',taskId:'prior-task',previousNotes:'Previous observation'}:null,warning:'Stop before work',specification:'Reviewed specification'}))})
 const before=JSON.stringify(job)
 render(<PrintChecklist bike={bikeFixture()} job={job} />)
 for(const label of ['To do','Done','Skipped','Not applicable','Previous activity notes','Previous observation','Observation does not mean done','Job observation'])expect(screen.getByText(label)).toBeInTheDocument()
 expect(screen.getByText(/Version 3/)).toBeInTheDocument();expect(screen.getByText(/2026-10-10/)).toBeInTheDocument();expect(screen.getByText(/12,000 km/)).toBeInTheDocument()
 expect(screen.getAllByText(/Parts unavailable/)).toHaveLength(2);expect(screen.getAllByText(/Stop before work/)).toHaveLength(4)
 expect(screen.getAllByLabelText(/Writing space/)).toHaveLength(4)
 expect(print).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Print'}));expect(print).toHaveBeenCalledOnce();expect(JSON.stringify(job)).toBe(before)
 print.mockRestore()
})
it('shows a base-template preview with blank work fields and long text',()=>{
 const long='Long observation '.repeat(240)
 render(<BlankPrintChecklist bike={bikeFixture()} template={templateFixture({tasks:[{...templateFixture().tasks[0],reference:long}]})} />)
 expect(screen.getByText(/Base-template preview/)).toBeInTheDocument()
 expect(screen.getByLabelText('Blank date')).toHaveTextContent('Date:')
 expect(screen.getByLabelText('Blank mileage')).toHaveTextContent('Mileage:')
 expect(screen.getByText(long.trim())).toHaveClass('print-text')
 expect(screen.getByText(long.trim()).closest('article')).toHaveClass('print-task-long')
 expect(screen.getByText('To do')).toBeInTheDocument();expect(screen.queryByText(/2026-10-10/)).not.toBeInTheDocument()
})

import {ChecklistRow} from './ChecklistRow'
it.each(['inspect','replace'] as const)('shows neutral custom labels with the saved %s action in work and print',action=>{
 const task=taskFixture({label:'Air filter',action})
 const {unmount}=render(<ChecklistRow task={task} onChange={vi.fn()} />)
 expect(screen.getByText(`Action: ${action}`)).toBeInTheDocument();unmount()
 render(<PrintChecklist bike={bikeFixture()} job={jobFixture({tasks:[task]})} />)
 expect(screen.getByText(`Action: ${action}`)).toBeInTheDocument()
})
it('does not certify an owner-authored source-like saved snapshot',()=>{
 const {unmount}=render(<PrintChecklist bike={bikeFixture()} job={jobFixture({template:templateFixture({kind:'scheduled'})})} />)
 expect(screen.queryByText(/Reviewed service template/)).not.toBeInTheDocument()
 expect(screen.getByText(/Saved template snapshot/)).toBeInTheDocument();unmount()
 render(<BlankPrintChecklist bike={bikeFixture()} template={templateFixture({kind:'scheduled'})} />)
 expect(screen.getByText(/Reviewed service template/)).toBeInTheDocument()
})

import {saveBike,saveQuickJob,correctJob,startMaintenanceJob} from '../actions'
vi.mock('../actions',()=>({saveBike:vi.fn(),saveQuickJob:vi.fn(),correctJob:vi.fn(),startMaintenanceJob:vi.fn()}))
it('opens and prints saved and blank sheets without any write action or network request',()=>{
 const request=vi.spyOn(globalThis,'fetch').mockRejectedValue(new Error('Unexpected network write'))
 const print=vi.spyOn(window,'print').mockImplementation(()=>{})
 const {unmount}=render(<PrintChecklist bike={bikeFixture()} job={jobFixture()} />)
 fireEvent.click(screen.getByRole('button',{name:'Print'}));unmount()
 render(<BlankPrintChecklist bike={bikeFixture()} template={templateFixture()} />)
 fireEvent.click(screen.getByRole('button',{name:'Print'}))
 expect(print).toHaveBeenCalledTimes(2);expect(request).not.toHaveBeenCalled()
 for(const write of [saveBike,saveQuickJob,correctJob,startMaintenanceJob])expect(write).not.toHaveBeenCalled()
 print.mockRestore();request.mockRestore()
})
