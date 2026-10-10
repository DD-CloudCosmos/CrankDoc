import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { jobFixture } from '@/test/garageFixtures'
import { MaintenanceHistory } from './MaintenanceHistory'
const callbacks=()=>({onEdit:vi.fn(),onDelete:vi.fn()})
it('separates active jobs first and orders closed history by date then creation time',()=>{
 render(<MaintenanceHistory jobs={[jobFixture({id:'older',title:'Older',status:'completed',date:'2025-01-01'}),jobFixture({id:'late',title:'Later',status:'partial',createdAt:'2026-10-10T12:00:00Z'}),jobFixture({id:'early',title:'Earlier',status:'completed'}),jobFixture({id:'active',title:'Active',date:'2024-01-01'})]} {...callbacks()} />)
 const rows=screen.getAllByRole('button',{name:/Show record/}); expect(rows.map(row=>row.textContent)).toEqual([expect.stringContaining('Active'),expect.stringContaining('Later'),expect.stringContaining('Earlier'),expect.stringContaining('Older')])
})
it('searches titles, task labels and notes as text and distinguishes no matches',()=>{
 render(<MaintenanceHistory jobs={[jobFixture({title:'Engine oil',notes:'<script>private</script>'})]} {...callbacks()} />)
 for(const query of ['ENGINE','chain','PRIVATE']) {fireEvent.change(screen.getByLabelText('Search maintenance'),{target:{value:query}});expect(screen.getByRole('button',{name:/Show record/})).toBeInTheDocument()}
 fireEvent.change(screen.getByLabelText('Search maintenance'),{target:{value:'missing'}});expect(screen.getByText('No matching records')).toBeInTheDocument()
})
it('has an empty state',()=>{render(<MaintenanceHistory jobs={[]} {...callbacks()} />);expect(screen.getByText('No maintenance recorded')).toBeInTheDocument()})
it('requires explicit edit and delete confirmation and keeps failed edits',async()=>{
 const job=jobFixture({status:'completed'}); const onEdit=vi.fn().mockResolvedValue({ok:false,error:'conflict',message:'Record changed'});const onDelete=vi.fn().mockResolvedValue({ok:true,value:null});render(<MaintenanceHistory jobs={[job]} onEdit={onEdit} onDelete={onDelete} />)
 fireEvent.click(screen.getByRole('button',{name:/Show record/}));expect(onEdit).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Edit record'}));fireEvent.change(screen.getByLabelText('Job title'),{target:{value:'Correction'}});fireEvent.click(screen.getByRole('button',{name:'Save correction'}));expect(onEdit).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Confirm correction'}));expect(await screen.findByRole('alert')).toHaveTextContent('Record changed');expect(screen.getByLabelText('Job title')).toHaveValue('Correction');fireEvent.click(screen.getByRole('button',{name:'Cancel edit'}));fireEvent.click(screen.getByRole('button',{name:'Remove record'}));expect(onDelete).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Confirm removal'}));await waitFor(()=>expect(onDelete).toHaveBeenCalledWith(job.id))
})
it('renders HTML-looking notes as text and retains failed removals',async()=>{
 const job=jobFixture({notes:'<script>private</script>'});const onDelete=vi.fn().mockResolvedValue({ok:false,error:'save_failed',message:'Removal failed'});render(<MaintenanceHistory jobs={[job]} onEdit={vi.fn()} onDelete={onDelete} />);fireEvent.click(screen.getByRole('button',{name:/Show record/}));expect(screen.getByText('<script>private</script>')).toBeInTheDocument();expect(document.querySelector('script')).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Remove record'}));fireEvent.click(screen.getByRole('button',{name:'Confirm removal'}));expect(await screen.findByRole('alert')).toHaveTextContent('Removal failed');expect(screen.getByRole('button',{name:/Show record/})).toBeInTheDocument();expect(screen.getByRole('button',{name:'Confirm removal'})).toBeEnabled()
})
it('offers both downloads for the current bike even with an empty or filtered history',()=>{
 render(<MaintenanceHistory bikeId="owned-bike" jobs={[]} {...callbacks()} />)
 expect(screen.getByText('Export records')).toBeInTheDocument()
 for(const format of ['JSON','CSV']) expect(screen.getByRole('link',{name:`Download ${format}`})).toHaveAttribute('href',`/api/garage/export?bikeId=owned-bike&format=${format.toLowerCase()}`)
})
it('keeps failed corrections while collapsing, opening another row and filtering the record',async()=>{
 const jobs=[jobFixture({title:'First'}),jobFixture({id:'second',title:'Second'})]
 render(<MaintenanceHistory jobs={jobs} onEdit={vi.fn().mockResolvedValue({ok:false,error:'save_failed',message:'Correction failed'})} onDelete={vi.fn()} />)
 fireEvent.click(screen.getByRole('button',{name:'Show record: First'}));fireEvent.click(screen.getByRole('button',{name:'Edit record'}))
 fireEvent.change(screen.getByLabelText('Job title'),{target:{value:'Unsaved correction'}})
 fireEvent.click(screen.getByRole('button',{name:'Save correction'}));fireEvent.click(screen.getByRole('button',{name:'Confirm correction'}))
 expect(await screen.findByRole('alert')).toHaveTextContent('Correction failed')
 fireEvent.click(screen.getByRole('button',{name:'Show record: First'}));fireEvent.click(screen.getByRole('button',{name:'Show record: Second'}))
 fireEvent.change(screen.getByLabelText('Search maintenance'),{target:{value:'Second'}})
 fireEvent.change(screen.getByLabelText('Search maintenance'),{target:{value:''}})
 fireEvent.click(screen.getByRole('button',{name:'Show record: First'}))
 expect(screen.getByLabelText('Job title')).toHaveValue('Unsaved correction')
 expect(screen.getByRole('alert')).toHaveTextContent('Correction failed')
})
import {uploadPrivateFile} from '@/lib/maintenance/uploads'
vi.mock('@/lib/maintenance/uploads',()=>({uploadPrivateFile:vi.fn(),privateFileRequest:vi.fn()}))
it('keeps mixed receipt results and retry identity after collapse and search hiding',async()=>{
 vi.mocked(uploadPrivateFile).mockResolvedValueOnce({id:'first',path:'first.pdf'}).mockRejectedValueOnce(new Error('Second failed')).mockResolvedValueOnce({id:'second',path:'second.pdf'})
 render(<MaintenanceHistory jobs={[jobFixture({title:'First'}),jobFixture({id:'second',title:'Second'})]} {...callbacks()} onFilesChanged={vi.fn()} />)
 fireEvent.click(screen.getByRole('button',{name:'Show record: First'}))
 fireEvent.change(screen.getByLabelText('Optional receipts'),{target:{files:[new File(['pdf'],'first.pdf',{type:'application/pdf'}),new File(['pdf'],'second.pdf',{type:'application/pdf'})]}})
 fireEvent.click(screen.getByRole('button',{name:'Save receipts'}))
 expect(await screen.findByText('second.pdf: Second failed')).toBeInTheDocument()
 const failedId=vi.mocked(uploadPrivateFile).mock.calls[1][1].id
 fireEvent.click(screen.getByRole('button',{name:'Show record: First'}))
 fireEvent.change(screen.getByLabelText('Search maintenance'),{target:{value:'Second'}})
 fireEvent.change(screen.getByLabelText('Search maintenance'),{target:{value:''}})
 fireEvent.click(screen.getByRole('button',{name:'Show record: First'}))
 expect(screen.getByText('first.pdf: Saved')).toBeVisible();expect(screen.getByText('second.pdf: Second failed')).toBeVisible()
 fireEvent.click(screen.getByRole('button',{name:'Retry receipts'}))
 await waitFor(()=>expect(screen.getByText('second.pdf: Saved')).toBeInTheDocument())
 expect(uploadPrivateFile).toHaveBeenCalledTimes(3);expect(vi.mocked(uploadPrivateFile).mock.calls[2][1].id).toBe(failedId)
})
vi.mock('@/lib/supabase/auth-browser',()=>({createAuthBrowserClient:()=>({auth:{onAuthStateChange:()=>({data:{subscription:{unsubscribe:vi.fn()}}})}})}))
it('finds carry destinations from task origins when opening source history',()=>{
 const source=jobFixture({title:'Original service'}),destination=jobFixture({id:'destination',title:'Next service',tasks:[{...jobFixture().tasks[0],origin:{jobId:source.id,taskId:source.tasks[0].id,previousNotes:'Old'}}]})
 render(<MaintenanceHistory jobs={[source,destination]} {...callbacks()} />)
 fireEvent.click(screen.getByRole('button',{name:'Show record: Original service'}))
 expect(screen.getByRole('link',{name:'Carried work: Next service'})).toHaveAttribute('href',`/garage/${source.bikeId}/jobs/destination`)
})

it('retains typed corrections and receipt selections when the row changes status group',()=>{
 const job=jobFixture({title:'Moving'})
 const props={...callbacks(),onFilesChanged:vi.fn()}
 const {rerender}=render(<MaintenanceHistory jobs={[job]} {...props} />)
 fireEvent.click(screen.getByRole('button',{name:'Show record: Moving'}));fireEvent.click(screen.getByRole('button',{name:'Edit record'}))
 fireEvent.change(screen.getByLabelText('Job title'),{target:{value:'Keep this'}})
 fireEvent.change(screen.getByLabelText('Optional receipts'),{target:{files:[new File(['pdf'],'keep.pdf',{type:'application/pdf'})]}})
 rerender(<MaintenanceHistory jobs={[{...job,status:'completed',revision:2}]} {...props} />)
 expect(screen.getByLabelText('Job title')).toHaveValue('Keep this')
 expect(screen.getByText('keep.pdf: Ready to save')).toBeVisible()
})
it('reloads the saved correction revision while retaining the draft for explicit review',async()=>{
 const job=jobFixture(),current={...job,title:'Other device',revision:2}
 const onEdit=vi.fn().mockResolvedValueOnce({ok:false,error:'conflict',message:'Changed',current}).mockResolvedValueOnce({ok:true,value:{...current,title:'My correction',revision:3}})
 render(<MaintenanceHistory jobs={[job]} onEdit={onEdit} onDelete={vi.fn()} />)
 fireEvent.click(screen.getByRole('button',{name:/Show record/}));fireEvent.click(screen.getByRole('button',{name:'Edit record'}))
 fireEvent.change(screen.getByLabelText('Job title'),{target:{value:'My correction'}})
 fireEvent.click(screen.getByRole('button',{name:'Save correction'}));fireEvent.click(screen.getByRole('button',{name:'Confirm correction'}))
 await screen.findByRole('alert');fireEvent.click(screen.getByRole('button',{name:'Review saved version'}))
 expect(screen.getByLabelText('Job title')).toHaveValue('My correction')
 expect(screen.getByText(/Saved work: Other device/)).toBeInTheDocument()
 expect(onEdit).toHaveBeenCalledTimes(1)
 fireEvent.click(screen.getByRole('button',{name:'Save correction'}));fireEvent.click(screen.getByRole('button',{name:'Confirm correction'}))
 await waitFor(()=>expect(onEdit).toHaveBeenLastCalledWith(job.id,2,expect.objectContaining({title:'My correction'})))
})
it('retains newer typing while a saved-version reload is pending',async()=>{
 const job=jobFixture();let finish!:(value:ReturnType<typeof jobFixture>)=>void
 const onReload=vi.fn(()=>new Promise<ReturnType<typeof jobFixture>>(resolve=>{finish=resolve}))
 const onEdit=vi.fn().mockResolvedValue({ok:false,error:'conflict',message:'Changed',current:{...job,revision:2}})
 render(<MaintenanceHistory jobs={[job]} onEdit={onEdit} onDelete={vi.fn()} onReload={onReload} />)
 fireEvent.click(screen.getByRole('button',{name:/Show record/}));fireEvent.click(screen.getByRole('button',{name:'Edit record'}))
 fireEvent.change(screen.getByLabelText('Job title'),{target:{value:'First draft'}})
 fireEvent.click(screen.getByRole('button',{name:'Save correction'}));fireEvent.click(screen.getByRole('button',{name:'Confirm correction'}))
 await screen.findByRole('alert');fireEvent.click(screen.getByRole('button',{name:'Review saved version'}))
 fireEvent.change(screen.getByLabelText('Job title'),{target:{value:'Newer draft'}})
 finish({...job,title:'Latest saved',revision:3})
 await screen.findByText('Saved work: Latest saved')
 expect(screen.getByLabelText('Job title')).toHaveValue('Newer draft')
 expect(onEdit).toHaveBeenCalledTimes(1)
})
