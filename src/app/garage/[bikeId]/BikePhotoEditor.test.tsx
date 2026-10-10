import {it,expect,vi,beforeEach} from 'vitest'
import {render,screen,fireEvent,waitFor,act} from '@testing-library/react'
import {bikeFixture} from '@/test/garageFixtures'
import {BikePhotoEditor,PrivateBikePhoto} from './BikePhotoEditor'
import {uploadPrivateFile,privateFileRequest} from '@/lib/maintenance/uploads'
import {createAuthBrowserClient} from '@/lib/supabase/auth-browser'
vi.mock('@/lib/maintenance/uploads',()=>({uploadPrivateFile:vi.fn(),privateFileRequest:vi.fn()}))
vi.mock('../PrivateGarage',()=>({useGarageOwner:()=> 'owner'}))
vi.mock('@/lib/supabase/auth-browser',()=>({createAuthBrowserClient:vi.fn()}))
let authChange:(event:string,session:unknown)=>void
beforeEach(()=>{
 vi.resetAllMocks();vi.stubGlobal('URL',Object.assign(URL,{createObjectURL:vi.fn(()=> 'blob:preview'),revokeObjectURL:vi.fn()}))
 vi.mocked(createAuthBrowserClient).mockReturnValue({auth:{onAuthStateChange:(callback:typeof authChange)=>{authChange=callback;return {data:{subscription:{unsubscribe:vi.fn()}}}}}} as never)
})
it('previews and cancels without changing the saved image',()=>{
 const changed=vi.fn();render(<BikePhotoEditor bike={bikeFixture()} onChanged={changed} />)
 fireEvent.click(screen.getByRole('button',{name:'Edit image'}));fireEvent.change(screen.getByLabelText('Choose bike photo'),{target:{files:[new File(['jpg'],'bike.jpg',{type:'image/jpeg'})]}})
 expect(screen.getByAltText('Photo preview')).toHaveAttribute('src','blob:preview')
 fireEvent.click(screen.getByRole('button',{name:'Cancel image edit'}));expect(screen.queryByAltText('Photo preview')).not.toBeInTheDocument();expect(uploadPrivateFile).not.toHaveBeenCalled();expect(changed).not.toHaveBeenCalled()
})
it('keeps failed preview and stable ID for a retry, then reconciles the saved photo',async()=>{
 vi.mocked(uploadPrivateFile).mockRejectedValueOnce(new Error('Upload failed')).mockResolvedValueOnce({id:'file',path:'saved.webp'})
 const changed=vi.fn();render(<BikePhotoEditor bike={bikeFixture()} onChanged={changed} />);fireEvent.click(screen.getByRole('button',{name:'Edit image'}));fireEvent.change(screen.getByLabelText('Choose bike photo'),{target:{files:[new File(['jpg'],'bike.jpg',{type:'image/jpeg'})]}});fireEvent.click(screen.getByRole('button',{name:'Save image'}))
 expect(await screen.findByRole('alert')).toHaveTextContent('Upload failed');expect(screen.getByAltText('Photo preview')).toBeInTheDocument();expect(changed).not.toHaveBeenCalled()
 fireEvent.click(screen.getByRole('button',{name:'Save image'}));await waitFor(()=>expect(changed).toHaveBeenCalledTimes(1));expect(vi.mocked(uploadPrivateFile).mock.calls[0][1].id).toBe(vi.mocked(uploadPrivateFile).mock.calls[1][1].id)
})
it('restores the library only after explicit confirmation',async()=>{
 vi.mocked(privateFileRequest).mockResolvedValue({});const changed=vi.fn();render(<BikePhotoEditor bike={bikeFixture({photoPath:'owner/bikes/bike/file.webp'})} onChanged={changed} />)
 fireEvent.click(screen.getByRole('button',{name:'Restore library image'}));expect(privateFileRequest).not.toHaveBeenCalled()
 fireEvent.click(screen.getByRole('button',{name:'Confirm library image'}));await waitFor(()=>expect(changed).toHaveBeenCalled());expect(privateFileRequest).toHaveBeenCalledWith('DELETE',{bikeId:bikeFixture().id,restoreDefault:true,confirmed:true})
})
it('renews private signed URLs at expiry, clears them on sign-out, and never uses shared optimization',async()=>{
 vi.useFakeTimers();vi.mocked(privateFileRequest).mockResolvedValueOnce({url:'https://local.invalid/first',expiresIn:60}).mockResolvedValueOnce({url:'https://local.invalid/second',expiresIn:60})
 render(<PrivateBikePhoto bike={bikeFixture({photoPath:'owner/bikes/bike/file.webp'})} />)
 await act(async()=>{});expect(screen.getByRole('img')).toHaveAttribute('src','https://local.invalid/first')
 await act(async()=>{await vi.advanceTimersByTimeAsync(60_001)});expect(screen.getByRole('img')).toHaveAttribute('src','https://local.invalid/second')
 act(()=>authChange('SIGNED_OUT',null));expect(screen.getByRole('img')).not.toHaveAttribute('src');vi.useRealTimers()
})
