import {it,expect,vi,beforeEach} from 'vitest'
import {render,screen,fireEvent,waitFor} from '@testing-library/react'
import {ReceiptUpload} from './ReceiptUpload'
import {uploadPrivateFile,privateFileRequest} from '@/lib/maintenance/uploads'
vi.mock('@/lib/maintenance/uploads',()=>({uploadPrivateFile:vi.fn(),privateFileRequest:vi.fn()}))
vi.mock('../PrivateGarage',()=>({useGarageOwner:()=> 'owner'}))
beforeEach(()=>vi.resetAllMocks())
it('retains successful receipts when a later file fails and retries only that stable file',async()=>{
 vi.mocked(uploadPrivateFile).mockResolvedValueOnce({id:'first',path:'first.pdf'}).mockRejectedValueOnce(new Error('Second upload failed')).mockResolvedValueOnce({id:'second',path:'second.pdf'})
 const changed=vi.fn();render(<ReceiptUpload bikeId="bike" jobId="job" onChanged={changed} />)
 fireEvent.change(screen.getByLabelText('Optional receipts'),{target:{files:[new File(['%PDF'],'first.pdf',{type:'application/pdf'}),new File(['%PDF'],'second.pdf',{type:'application/pdf'})]}})
 fireEvent.click(screen.getByRole('button',{name:'Save receipts'}))
 expect(await screen.findByText('second.pdf: Second upload failed')).toBeInTheDocument();expect(screen.getByText('first.pdf: Saved')).toBeInTheDocument();expect(changed).toHaveBeenCalledTimes(1)
 fireEvent.click(screen.getByRole('button',{name:'Retry receipts'}));await waitFor(()=>expect(screen.getByText('second.pdf: Saved')).toBeInTheDocument())
 expect(uploadPrivateFile).toHaveBeenCalledTimes(3);expect(vi.mocked(uploadPrivateFile).mock.calls[1][1].id).toBe(vi.mocked(uploadPrivateFile).mock.calls[2][1].id)
})
it('shows filenames as plain text and downloads with a fresh owner link on each click',async()=>{
 const filename='<script>private.pdf';const file={id:'file',bikeId:'bike',jobId:'job',kind:'receipt' as const,path:'private.pdf',filename,cleanupPending:false}
 vi.mocked(privateFileRequest).mockResolvedValue({url:'https://local.invalid/receipt',expiresIn:60});const click=vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{})
 const {container}=render(<ReceiptUpload bikeId="bike" jobId="job" files={[file]} onChanged={vi.fn()} />)
 expect(screen.getByText(filename)).toBeInTheDocument();expect(container.querySelector('script,iframe,object,embed')).toBeNull()
 fireEvent.click(screen.getByRole('button',{name:`Download ${filename}`}));await waitFor(()=>expect(click).toHaveBeenCalledTimes(1));fireEvent.click(screen.getByRole('button',{name:`Download ${filename}`}));await waitFor(()=>expect(click).toHaveBeenCalledTimes(2));expect(privateFileRequest).toHaveBeenCalledTimes(2);click.mockRestore()
})

import {createAuthBrowserClient} from '@/lib/supabase/auth-browser'
import {act} from '@testing-library/react'
vi.mock('@/lib/supabase/auth-browser',()=>({createAuthBrowserClient:vi.fn()}))
let authChange:(event:string,session:unknown)=>void=()=>{}
beforeEach(()=>vi.mocked(createAuthBrowserClient).mockReturnValue({auth:{onAuthStateChange:(callback:typeof authChange)=>{authChange=callback;return {data:{subscription:{unsubscribe:vi.fn()}}}}}} as never))
it('discards an in-flight receipt URL after sign-out or account change',async()=>{
 let finish!:(result:{url:string})=>void;vi.mocked(privateFileRequest).mockImplementation(()=>new Promise(resolve=>{finish=resolve}))
 const file={id:'file',bikeId:'bike',jobId:'job',kind:'receipt' as const,path:'receipt.pdf',filename:'receipt.pdf',cleanupPending:false}
 const click=vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{})
 render(<ReceiptUpload bikeId="bike" jobId="job" files={[file]} onChanged={vi.fn()} />)
 fireEvent.click(screen.getByRole('button',{name:'Download receipt.pdf'}));act(()=>authChange('SIGNED_OUT',null));await act(async()=>finish({url:'https://local.invalid/stale-owner-link'}));expect(click).not.toHaveBeenCalled();click.mockRestore()
})
