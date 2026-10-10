// @vitest-environment node
import {beforeEach,expect,it,vi} from 'vitest'
import {getAccount} from '@/lib/account'
import {getBike} from '@/lib/garageRepository.server'
import {listJobs} from '@/lib/maintenance/jobsRepository.server'
import {listPrivateFiles} from '@/lib/maintenance/uploads.server'
import {bikeFixture,jobFixture} from '@/test/garageFixtures'
import {GET} from './route'
vi.mock('@/lib/account',()=>({getAccount:vi.fn()}))
vi.mock('@/lib/garageRepository.server',()=>({getBike:vi.fn()}))
vi.mock('@/lib/maintenance/jobsRepository.server',()=>({listJobs:vi.fn()}))
vi.mock('@/lib/maintenance/uploads.server',()=>({listPrivateFiles:vi.fn()}))
const account={userId:'owner',client:{}} as never
const bike=bikeFixture({nickname:'Été"\r\nX-Evil: yes/../../'})
const request=(format='json',id=bike.id)=>new Request(`http://localhost/api/garage/export?bikeId=${id}&format=${format}`)
beforeEach(()=>{vi.clearAllMocks();vi.mocked(getAccount).mockResolvedValue(account);vi.mocked(getBike).mockResolvedValue(bike);vi.mocked(listJobs).mockResolvedValue([jobFixture()]);vi.mocked(listPrivateFiles).mockResolvedValue([])})
it('denies signed-out downloads and marks every response private',async()=>{
 vi.mocked(getAccount).mockResolvedValue(null);const response=await GET(request());expect(response.status).toBe(401);expect(response.headers.get('Cache-Control')).toBe('private, no-store')
 expect(getBike).not.toHaveBeenCalled()
})
it.each(['foreign','unknown'])('returns the same 404 for %s bikes',async()=>{
 vi.mocked(getBike).mockResolvedValue(null);const response=await GET(request());expect(response.status).toBe(404);expect(await response.json()).toEqual({message:'Bike not found.'});expect(listJobs).not.toHaveBeenCalled()
})
it('rejects unsupported formats and malformed identifiers',async()=>{
 expect((await GET(request('html'))).status).toBe(400);expect((await GET(request('json','bad'))).status).toBe(400);expect(getBike).not.toHaveBeenCalled()
})
it('downloads facts using the owner client, excludes cleanup rows and keeps saved source-pending files',async()=>{
 const file={id:'saved',bikeId:bike.id,jobId:jobFixture().id,kind:'receipt' as const,path:'secret',filename:'receipt.pdf',cleanupPending:false,sourcePending:true}
 vi.mocked(listPrivateFiles).mockResolvedValue([file,{...file,id:'removed',cleanupPending:true},{...file,id:'foreign',bikeId:'foreign'}])
 const response=await GET(request());expect(response.status).toBe(200);expect(response.headers.get('Content-Type')).toBe('application/json; charset=utf-8');expect(response.headers.get('Cache-Control')).toBe('private, no-store')
 expect(response.headers.get('Content-Disposition')).toMatch(/^attachment; filename="[a-zA-Z0-9_-]+\.json"$/)
 const data=await response.json();expect(data.files).toEqual([{id:'saved',jobId:file.jobId,kind:'receipt',filename:'receipt.pdf'}])
 expect(getBike).toHaveBeenCalledWith(account,bike.id);expect(listJobs).toHaveBeenCalledWith(account,bike.id);expect(listPrivateFiles).toHaveBeenCalledWith(account,bike.id)
 const csv=await GET(request('csv'));expect(csv.headers.get('Content-Type')).toBe('text/csv; charset=utf-8');expect(await csv.text()).toContain('"2026-10-10"')
})
it('keeps errors private and does not expose database details',async()=>{
 vi.mocked(listJobs).mockRejectedValue(new Error('secret'));const response=await GET(request());expect(response.status).toBe(500);expect(await response.text()).not.toContain('secret')
})
