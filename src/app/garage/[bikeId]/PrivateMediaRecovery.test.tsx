import {act,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {beforeEach,expect,it,vi} from 'vitest'
import {PrivateGarage} from '../PrivateGarage'
import {PrivateBikePhoto} from './BikePhotoEditor'
import {ReceiptUpload} from './ReceiptUpload'
import {bikeFixture} from '@/test/garageFixtures'
import {privateFileRequest} from '@/lib/maintenance/uploads'
const auth=vi.hoisted(()=>({getUser:vi.fn(),listeners:new Set<(event:string,session:unknown)=>void>()}))
vi.mock('@/lib/supabase/auth-browser',()=>({createAuthBrowserClient:()=>({auth:{getUser:auth.getUser,onAuthStateChange:(callback:(event:string,session:unknown)=>void)=>{auth.listeners.add(callback);return {data:{subscription:{unsubscribe:()=>auth.listeners.delete(callback)}}}}}})}))
vi.mock('@/lib/maintenance/uploads',()=>({privateFileRequest:vi.fn(),uploadPrivateFile:vi.fn()}))
const file={id:'receipt',bikeId:'bike',jobId:'job',kind:'receipt' as const,path:'receipt.pdf',filename:'receipt.pdf',cleanupPending:false}
function view(){return <PrivateGarage ownerId="owner"><PrivateBikePhoto bike={bikeFixture({photoPath:'owner/bikes/bike/photo.webp'})}/><ReceiptUpload bikeId="bike" jobId="job" files={[file]} onChanged={vi.fn()}/></PrivateGarage>}
beforeEach(()=>{vi.resetAllMocks();auth.listeners.clear();auth.getUser.mockResolvedValue({data:{user:{id:'owner'}},error:null});vi.mocked(privateFileRequest).mockResolvedValue({url:'https://local.invalid/fresh',expiresIn:60})})
it('renews photo and receipt controls only after verified same-owner recovery and discards earlier URLs',async()=>{
 const click=vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{})
 render(view());await waitFor(()=>expect(screen.getByRole('img')).toHaveAttribute('src','https://local.invalid/fresh'))
 let late!:(value:{url:string})=>void
 vi.mocked(privateFileRequest).mockImplementationOnce(()=>new Promise(resolve=>{late=resolve}))
 fireEvent.click(screen.getByRole('button',{name:'Download receipt.pdf'}))
 act(()=>{for(const callback of auth.listeners)callback('SIGNED_OUT',null)})
 await act(async()=>late({url:'https://local.invalid/stale'}));expect(click).not.toHaveBeenCalled()
 auth.getUser.mockResolvedValueOnce({data:{user:null},error:new Error('Expired')})
 fireEvent.focus(window);await act(async()=>{})
 expect(screen.queryByRole('img')).not.toBeInTheDocument()
 fireEvent.focus(window)
 await waitFor(()=>expect(screen.getByRole('img')).toHaveAttribute('src','https://local.invalid/fresh'))
 fireEvent.click(screen.getByRole('button',{name:'Download receipt.pdf'}));await waitFor(()=>expect(click).toHaveBeenCalledOnce())
 click.mockRestore()
})
it('keeps an unexpired photo while renewing and offers retry after failure',async()=>{
 render(view());await waitFor(()=>expect(screen.getByRole('img')).toHaveAttribute('src','https://local.invalid/fresh'))
 vi.mocked(privateFileRequest).mockRejectedValueOnce(new Error('Temporary failure'))
 fireEvent.focus(window)
 await waitFor(()=>expect(screen.getByRole('button',{name:'Retry photo'})).toBeVisible())
 expect(screen.getByRole('img')).toHaveAttribute('src','https://local.invalid/fresh')
 vi.mocked(privateFileRequest).mockResolvedValue({url:'https://local.invalid/retry',expiresIn:60})
 fireEvent.click(screen.getByRole('button',{name:'Retry photo'}))
 await waitFor(()=>expect(screen.getByRole('img')).toHaveAttribute('src','https://local.invalid/retry'))
})
it('permanently removes private controls after a verified owner change',async()=>{
 render(view());await waitFor(()=>expect(screen.getByRole('img')).toBeVisible())
 auth.getUser.mockResolvedValue({data:{user:{id:'other'}},error:null});fireEvent.focus(window)
 await waitFor(()=>expect(screen.queryByRole('button',{name:'Download receipt.pdf',hidden:true})).not.toBeInTheDocument())
 auth.getUser.mockResolvedValue({data:{user:{id:'owner'}},error:null});fireEvent.focus(window)
 await act(async()=>{});expect(screen.queryByRole('img',{hidden:true})).not.toBeInTheDocument()
})
import {announceGarageSignOut} from '@/lib/garageSession'
it('discards a late photo URL from before expiry and permanently revokes explicit logout',async()=>{
 render(view());await waitFor(()=>expect(screen.getByRole('img')).toBeVisible())
 let late!:(value:{url:string})=>void
 vi.mocked(privateFileRequest).mockImplementationOnce(()=>new Promise(resolve=>{late=resolve}))
 fireEvent.focus(window);await waitFor(()=>expect(late).toBeDefined())
 act(()=>{for(const callback of auth.listeners)callback('SIGNED_OUT',null)})
 await act(async()=>late({url:'https://local.invalid/expired'}))
 expect(screen.getByRole('img',{hidden:true})).not.toHaveAttribute('src')
 fireEvent.focus(window);await waitFor(()=>expect(screen.getByRole('img')).toHaveAttribute('src','https://local.invalid/fresh'))
 act(()=>announceGarageSignOut())
 expect(screen.queryByRole('img',{hidden:true})).not.toBeInTheDocument()
 fireEvent.focus(window);await act(async()=>{})
 expect(screen.queryByRole('button',{name:'Download receipt.pdf',hidden:true})).not.toBeInTheDocument()
})
