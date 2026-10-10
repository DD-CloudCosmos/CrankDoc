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
