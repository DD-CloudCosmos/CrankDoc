// @vitest-environment node
import sharp from 'sharp'
import {PDFDocument} from 'pdf-lib'
import { describe,it,expect } from 'vitest'
import { normaliseBikePhoto, validateReceipt, parseFileInput } from './uploads.server'
const id='00000000-0000-4000-8000-000000000001'
const bikeId='00000000-0000-4000-8000-000000000002'
describe('actual private file bytes',()=>{
 it('strips descriptive and GPS EXIF, rotates and bounds the saved WebP',async()=>{
  const source=await sharp({create:{width:1800,height:20,channels:3,background:'#555'}}).withExif({IFD0:{ImageDescription:'location fixture'},IFD3:{GPSLatitudeRef:'N',GPSLatitude:'51/1 12/1 0/1',GPSLongitudeRef:'E',GPSLongitude:'4/1 24/1 0/1'}}).jpeg().toBuffer()
  expect((await sharp(source).metadata()).exif).toBeDefined()
  const metadata=await sharp(await normaliseBikePhoto(source)).metadata()
  expect(metadata.format).toBe('webp');expect(metadata.width).toBe(1600)
  expect(metadata.exif).toBeUndefined();expect(metadata.xmp).toBeUndefined();expect(metadata.icc).toBeUndefined()
 })
 it.each([Buffer.from('<svg/>'),Buffer.from('<html/>'),Buffer.from('corrupt jpeg')])('rejects unsupported or corrupt photos',async source=>{await expect(normaliseBikePhoto(source)).rejects.toMatchObject({status:415})})
 it('rejects more than exactly 10 MiB',async()=>{await expect(normaliseBikePhoto(Buffer.alloc(10*1024*1024+1))).rejects.toMatchObject({status:413})})
 it('rejects more than 40 million decoded pixels',async()=>{
  const huge=await sharp({create:{width:8000,height:5001,channels:3,background:'#fff'}}).png().toBuffer()
  await expect(normaliseBikePhoto(huge)).rejects.toMatchObject({status:413})
 })
 it('requires decoded content to match the receipt extension',async()=>{
  const png=await sharp({create:{width:20,height:20,channels:3,background:'#fff'}}).png().toBuffer()
  await expect(validateReceipt(png,'png')).resolves.toBe('image/png')
  await expect(validateReceipt(png,'pdf')).rejects.toMatchObject({status:415})
  await expect(validateReceipt(Buffer.from('<html/>'),'pdf')).rejects.toMatchObject({status:415})
  await expect(validateReceipt(Buffer.from('%PDF-1.7\nreceipt\n%%EOF'),'pdf')).rejects.toMatchObject({status:415})
  const pdf=await PDFDocument.create();pdf.addPage([200,200])
  await expect(validateReceipt(Buffer.from(await pdf.save()),'pdf')).resolves.toBe('application/pdf')
  await expect(validateReceipt(Buffer.from('%PDF-1.7\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n%%EOF'),'pdf')).rejects.toMatchObject({status:415})
 })
 it('rejects foreign and traversal paths before storage is read',()=>{
  const input={id,bikeId,kind:'bike_photo',jobId:null,path:`owner/bikes/${bikeId}/${id}.source`,filename:'bike.jpg'}
  expect(parseFileInput(input,'owner')).toEqual(input)
  expect(()=>parseFileInput({...input,path:`foreign/bikes/${bikeId}/${id}.source`},'owner')).toThrow()
  expect(()=>parseFileInput({...input,path:'owner/../secret'},'owner')).toThrow()
  expect(()=>parseFileInput({...input,ownerId:'foreign'},'owner')).toThrow()
 })
})

import {readOwnedUpload,finaliseFile,removePrivateFile} from './uploads.server'
import type {AccountContext} from '@/lib/account'
import type {FileInput} from './types'
function clientFixture(responses:{data:unknown;error:unknown}[],storage:Record<string,unknown>,rpc:(name:string)=>Promise<{data:unknown;error:unknown}>=async()=>({data:null,error:null})) {
 const client={storage:{from:()=>storage},rpc,from:()=>{
  const result=responses.shift();if(!result)throw new Error('Missing response')
  const query:{[key:string]:unknown}={then:(resolve:(result:unknown)=>void)=>Promise.resolve(result).then(resolve)}
  for(const key of ['select','eq','maybeSingle','update','delete','order'])query[key]=()=>query
  return query
 }}
 return {client,userId:'owner'} as unknown as AccountContext
}
const fileInput:FileInput={id,bikeId,kind:'bike_photo',jobId:null,path:`owner/bikes/${bikeId}/${id}.source`,filename:'bike.jpg'}
it('checks actual downloaded size and rejects an inaccessible target before downloading',async()=>{
 let reads=0;const storage={download:async()=>{reads++;return {data:new Blob([Buffer.alloc(10*1024*1024+1)]),error:null}}}
 await expect(readOwnedUpload(clientFixture([{data:null,error:null}],storage),fileInput)).rejects.toMatchObject({status:404});expect(reads).toBe(0)
 await expect(readOwnedUpload(clientFixture([{data:{id:bikeId,file_cleanup_pending:false},error:null}],storage),fileInput)).rejects.toMatchObject({status:413});expect(reads).toBe(1)
})
it('a failed processed-photo upload never changes the previous override',async()=>{
 const jpeg=await sharp({create:{width:20,height:20,channels:3,background:'#555'}}).jpeg().toBuffer()
 let attaches=0
 const account=clientFixture([{data:{id:bikeId},error:null},{data:null,error:null},{data:{id:bikeId},error:null}],{download:async()=>({data:new Blob([new Uint8Array(jpeg)]),error:null}),upload:async()=>({error:{message:'Failed'}})},async name=>{if(name==='attach_garage_file')attaches++;return {data:'finalizing',error:null}})
 expect(await finaliseFile(account,fileInput,()=>account.client)).toMatchObject({ok:false,error:'save_failed'});expect(attaches).toBe(0)
})
it('retains attachment metadata when Storage removal fails',async()=>{
 const row={id,bike_id:bikeId,job_id:null,kind:'bike_photo',path:'owner/file.webp'}
 const account=clientFixture([{data:row,error:null}],{remove:async()=>({error:{message:'Unavailable'}})},async()=>({data:row,error:null}))
 const result=await removePrivateFile(account,id,()=>account.client);expect(result).toMatchObject({ok:false,error:'save_failed'});expect(result.ok?null:result.message).toMatch(/kept/)
})
it('reports a committed photo as saved if later cleanup fails, retaining retry information',async()=>{
 const jpeg=await sharp({create:{width:20,height:20,channels:3,background:'#555'}}).jpeg().toBuffer()
 const row={id,bike_id:bikeId,job_id:null,kind:'bike_photo',path:`owner/bikes/${bikeId}/${id}.webp`,source_pending:true}
 const account=clientFixture([{data:{id:bikeId},error:null},{data:null,error:null},{data:{id:bikeId},error:null},{data:null,error:null}],{download:async()=>({data:new Blob([new Uint8Array(jpeg)]),error:null}),upload:async()=>({error:null}),remove:async()=>({error:{message:'Cleanup unavailable'}})},async name=>({data:name==='begin_garage_finalisation'?'finalizing':row,error:null}))
 expect(await finaliseFile(account,fileInput,()=>account.client)).toMatchObject({ok:true,value:{id,path:row.path,cleanupPending:true}})
})
it('returns not-found when another account already owns a requested stable file ID',async()=>{
 const jpeg=await sharp({create:{width:20,height:20,channels:3,background:'#555'}}).jpeg().toBuffer()
 const account=clientFixture([{data:{id:bikeId},error:null},{data:null,error:null},{data:{id:bikeId},error:null}],{download:async()=>({data:new Blob([new Uint8Array(jpeg)]),error:null}),upload:async()=>({error:null})},async()=>({data:null,error:{code:'23505'}}))
 expect(await finaliseFile(account,fileInput,()=>account.client)).toMatchObject({ok:false,error:'not_found'})
})
import {listPrivateFiles} from './uploads.server'
it('loads 1001 attachment facts with deterministic ordering even under a smaller server cap',async()=>{
 const rows=Array.from({length:1001},(_,i)=>({id:String(i),bike_id:bikeId,job_id:id,kind:'receipt',path:'private',filename:`${i}.pdf`,cleanup_pending:false,source_pending:false}))
 const orders:string[]=[]
 const client={from:()=>{let offset=0;const q={select:()=>q,eq:()=>q,order:(field:string)=>{orders.push(field);return q},range:(start:number)=>{offset=start;return q},then:(resolve:(value:unknown)=>void)=>Promise.resolve({data:rows.slice(offset,offset+400),error:null}).then(resolve)};return q}}
 expect(await listPrivateFiles({client,userId:'owner'} as unknown as AccountContext,bikeId)).toHaveLength(1001)
 expect(orders).toContain('id')
})
import {retryReceiptSourceCleanup} from './uploads.server'
it('retries receipt source cleanup after owner checks and keeps the saved attachment',async()=>{
 const row={id,bike_id:bikeId,job_id:id,kind:'receipt',path:`owner/jobs/${id}/${id}.pdf`,source_pending:true,cleanup_pending:false}
 const removed:string[][]=[]
 const account=clientFixture([{data:row,error:null},{data:{id:bikeId},error:null},{data:{id},error:null},{data:null,error:null},{data:null,error:null}],{remove:async(paths:string[])=>{removed.push(paths);return {error:null}}})
 expect(await retryReceiptSourceCleanup(account,id,()=>account.client)).toEqual({ok:true,value:null})
 expect(removed).toEqual([[`${row.path}.source`]])
})
it('never creates a cleanup writer for a foreign or removed receipt',async()=>{
 let writers=0
 for(const row of [null,{id,kind:'receipt',cleanup_pending:true}]) {
  const account=clientFixture([{data:row,error:null}],{})
  expect(await retryReceiptSourceCleanup(account,id,()=>{writers++;return account.client})).toMatchObject({ok:false,error:'not_found'})
 }
 expect(writers).toBe(0)
})
