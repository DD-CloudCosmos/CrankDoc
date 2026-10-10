// @vitest-environment node
import {beforeEach,it,expect,vi} from 'vitest'
import {getAccount} from '@/lib/account'
import {FileError,finaliseFileOrThrow,getPrivateFileUrl,removePrivateFile,restoreLibraryImage,retryBikePhotoCleanup} from '@/lib/maintenance/uploads.server'
import {POST,GET,DELETE} from './route'
vi.mock('@/lib/account',()=>({getAccount:vi.fn()}))
vi.mock('@/lib/maintenance/uploads.server',async importOriginal=>({...await importOriginal<object>(),finaliseFileOrThrow:vi.fn(),getPrivateFileUrl:vi.fn(),removePrivateFile:vi.fn(),restoreLibraryImage:vi.fn(),retryBikePhotoCleanup:vi.fn()}))
const account={client:{},userId:'owner'} as never
const id='00000000-0000-4000-8000-000000000001'
const request=(method:string,body:unknown)=>new Request('http://localhost/api/garage/files',{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
beforeEach(()=>{vi.clearAllMocks();vi.mocked(getAccount).mockResolvedValue(account)})
it('denies signed-out calls with private no-store responses',async()=>{
 vi.mocked(getAccount).mockResolvedValue(null)
 for(const response of [await POST(request('POST',{})),await GET(new Request(`http://localhost/api/garage/files?fileId=${id}`)),await DELETE(request('DELETE',{}))]) {expect(response.status).toBe(401);expect(response.headers.get('cache-control')).toBe('private, no-store')}
})
it.each([400,404,413,415])('preserves validation status %s',async status=>{
 vi.mocked(finaliseFileOrThrow).mockRejectedValue(new FileError(status,'Invalid file'))
 expect((await POST(request('POST',{}))).status).toBe(status)
})
it('finalises metadata, renews an owned 60-second link and removes files',async()=>{
 vi.mocked(finaliseFileOrThrow).mockResolvedValue({id,path:'owner/photo.webp'})
 const saved=await POST(request('POST',{}));expect(saved.status).toBe(200);expect(await saved.json()).toEqual({id,path:'owner/photo.webp'})
 vi.mocked(getPrivateFileUrl).mockResolvedValue('https://local.invalid/private')
 const signed=await GET(new Request(`http://localhost/api/garage/files?fileId=${id}`));expect(await signed.json()).toEqual({url:'https://local.invalid/private',expiresIn:60})
 vi.mocked(removePrivateFile).mockResolvedValue({ok:true,value:null});expect((await DELETE(request('DELETE',{fileId:id}))).status).toBe(200)
 vi.mocked(restoreLibraryImage).mockResolvedValue({ok:true,value:null});expect((await DELETE(request('DELETE',{bikeId:id,restoreDefault:true,confirmed:true}))).status).toBe(200)
})
it('returns identical not-found for missing and foreign files and rejects invalid identifiers',async()=>{
 vi.mocked(getPrivateFileUrl).mockResolvedValue(null)
 expect((await GET(new Request(`http://localhost/api/garage/files?fileId=${id}`))).status).toBe(404)
 expect((await GET(new Request('http://localhost/api/garage/files?fileId=bad'))).status).toBe(400)
 expect((await DELETE(request('DELETE',{bikeId:id,restoreDefault:true}))).status).toBe(400)
 expect((await POST(new Request('http://localhost/api/garage/files',{method:'POST',body:'bad json'}))).status).toBe(400)
})
it('exposes retained cleanup failures for retry',async()=>{
 vi.mocked(removePrivateFile).mockResolvedValue({ok:false,error:'save_failed',message:'Cleanup failed; retry'})
 const result=await DELETE(request('DELETE',{fileId:id}));expect(result.status).toBe(500);expect(await result.json()).toMatchObject({message:'Cleanup failed; retry'})
})

it('retries durable photo cleanup using only the authenticated account and bike ID',async()=>{
 vi.mocked(retryBikePhotoCleanup).mockResolvedValue({ok:true,value:null})
 expect((await POST(request('POST',{bikeId:id,cleanup:true}))).status).toBe(200)
 expect(retryBikePhotoCleanup).toHaveBeenCalledWith(account,id)
 expect((await POST(request('POST',{bikeId:id,cleanup:true,ownerId:'other'}))).status).toBe(400)
})
