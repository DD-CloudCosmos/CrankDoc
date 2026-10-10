import {it,expect,vi,beforeEach} from 'vitest'
import {uploadPrivateFile} from './uploads'
import {createAuthBrowserClient} from '@/lib/supabase/auth-browser'
vi.mock('@/lib/supabase/auth-browser',()=>({createAuthBrowserClient:vi.fn()}))
const upload=vi.fn();const from=vi.fn(()=>({upload}))
const input={id:'file',kind:'bike_photo' as const,bikeId:'bike',jobId:null,path:'owner/bikes/bike/file.source',filename:'photo.jpg'}
beforeEach(()=>{vi.resetAllMocks();from.mockReturnValue({upload});vi.mocked(createAuthBrowserClient).mockReturnValue({auth:{getUser:async()=>({data:{user:{id:'owner'}},error:null})},storage:{from}} as never)})
it('uploads directly to private storage then sends only metadata to finalise',async()=>{
 upload.mockResolvedValue({error:null});const fetcher=vi.fn().mockResolvedValueOnce({ok:false,status:404,json:async()=>({message:'Uploaded file not found'})}).mockResolvedValueOnce({ok:true,json:async()=>({id:'file',path:'owner/bikes/bike/file.webp'})});vi.stubGlobal('fetch',fetcher)
 await expect(uploadPrivateFile('owner',input,new File(['bytes'],'photo.jpg',{type:'image/jpeg'}))).resolves.toMatchObject({id:'file'})
 expect(from).toHaveBeenCalledWith('garage-photos');expect(upload.mock.calls[0][0]).toBe(input.path)
 expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual(input)
})
it('does not finalise a failed upload and retains the stable retry identifier',async()=>{
 upload.mockResolvedValue({error:{message:'Upload failed'}});const fetcher=vi.fn().mockResolvedValue({ok:false,status:404,json:async()=>({message:'Uploaded file not found'})});vi.stubGlobal('fetch',fetcher)
 await expect(uploadPrivateFile('owner',input,new File(['bytes'],'photo.jpg',{type:'image/jpeg'}))).rejects.toThrow('Upload failed');expect(fetcher).toHaveBeenCalledTimes(1)
})
it('does not upload a stale owner draft or an oversized file',async()=>{
 const file=new File(['bytes'],'photo.jpg',{type:'image/jpeg'})
 await expect(uploadPrivateFile('foreign',input,file)).rejects.toThrow('Sign in again')
 const large=new File([new Uint8Array(10*1024*1024+1)],'photo.jpg',{type:'image/jpeg'})
 await expect(uploadPrivateFile('owner',input,large)).rejects.toThrow('10 MiB')
 expect(upload).not.toHaveBeenCalled()
})

it('checks a stable finalized ID before uploading again after a lost response',async()=>{
 const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>({id:'file',path:'owner/bikes/bike/file.webp'})});vi.stubGlobal('fetch',fetcher)
 await expect(uploadPrivateFile('owner',input,new File(['bytes'],'photo.jpg',{type:'image/jpeg'}))).resolves.toMatchObject({id:'file'})
 expect(upload).not.toHaveBeenCalled()
})
