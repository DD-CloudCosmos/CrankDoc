import assert from 'node:assert/strict'
import sharp from 'sharp'
import {PDFDocument} from 'pdf-lib'
import { createClient } from '@supabase/supabase-js'
import { createLocalTestClients, loadGarageTestEnv } from './garage-test-env'
import { finaliseFile, getPrivateFileUrl, removePrivateFile, cleanupOwnedFiles, restoreLibraryImage, retryBikePhotoCleanup, retryReceiptSourceCleanup, listPrivateFiles } from '../src/lib/maintenance/uploads.server'
import type { FileInput } from '../src/lib/maintenance/types'

async function main() {
 const t=await createLocalTestClients();const account={client:t.a,userId:t.userA};const foreign={client:t.b,userId:t.userB}
 const writer=()=>t.admin
 const document=await PDFDocument.create();document.addPage();const pdf=Buffer.from(await document.save())
 const bike=crypto.randomUUID();const otherBike=crypto.randomUUID();const job=crypto.randomUUID();const uploaded:{bucket:string;path:string}[]=[]
 try {
  const bikes=await t.a.from('garage_bikes').insert([bike,otherBike].map(id=>({id,owner_id:t.userA,make:'Honda',model:'CB650RA',motorcycle_id:t.modelId,year:2023})))
  assert.ifError(bikes.error)
  const created=await t.a.rpc('create_quick_job',{p_draft:{id:job,bikeId:bike,title:'Receipt fixture',date:'2026-10-10',mileageKm:12,template:null,tasks:[{id:crypto.randomUUID(),key:null,label:'Oil',action:'replace',state:'done',reason:'',notes:'',doneAt:'2026-10-10T12:00:00Z',origin:null,reference:null,warning:null,specification:null,safety:null}],notes:'',parts:'',performer:'',costMinor:null,currency:null}})
  assert.ifError(created.error)
  const photoBytes=await sharp({create:{width:20,height:20,channels:3,background:'#777'}}).withExif({IFD0:{ImageDescription:'private location'}}).jpeg().toBuffer()
  async function upload(input:FileInput,bytes:Buffer,type:string) {const bucket=input.kind==='bike_photo'?'garage-photos':'garage-receipts';const result=await t.a.storage.from(bucket).upload(input.path,bytes,{contentType:type});assert.ifError(result.error);uploaded.push({bucket,path:input.path})}
  function photo(bikeId=bike):FileInput {const id=crypto.randomUUID();return {id,kind:'bike_photo',bikeId,jobId:null,path:`${t.userA}/bikes/${bikeId}/${id}.source`,filename:'photo.jpg'}}
  const p=photo();await upload(p,photoBytes,'image/jpeg')
  const bypass=await t.a.storage.from('garage-photos').upload(p.path.replace('.source','.webp'),photoBytes,{contentType:'image/webp'});assert.ok(bypass.error,'Authenticated callers cannot write finalized bytes')
  assert.ok((await t.a.from('garage_files').insert({id:p.id,owner_id:t.userA,bike_id:bike,job_id:null,kind:'bike_photo',path:p.path.replace('.source','.webp'),filename:'bypass.jpg',mime_type:'image/webp',size_bytes:photoBytes.length})).error,'Metadata inserts require trusted transition')
  assert.ok((await t.a.rpc('begin_garage_finalisation',{p_owner_id:t.userA,p_input:{...p,path:p.path.replace('.source','.webp')}})).error,'Authenticated caller cannot invoke trusted RPC')
  assert.ok((await t.a.from('garage_bikes').update({photo_path:p.path.replace('.source','.webp')}).eq('id',bike)).error,'Owner cannot bypass validated photo transition')
  // A cancelled edit never changes a bike or the catalogue.
  assert.equal((await t.a.from('garage_bikes').select('photo_path').eq('id',bike).single()).data?.photo_path,null)
  assert.equal((await t.admin.from('motorcycles').select('image_url').eq('id',t.modelId).single()).data?.image_url,'/images/bikes/honda-cb650ra-2023.png')
  const bucket=t.b.storage.from('garage-photos')
  assert.equal((await bucket.list(`${t.userA}/bikes/${bike}`)).data?.length??0,0)
  assert.ok((await bucket.download(p.path)).error)
  assert.ok((await bucket.createSignedUrl(p.path,60)).error)
  assert.ok((await bucket.upload(p.path,photoBytes,{contentType:'image/jpeg',upsert:true})).error)
  const deniedDelete=await bucket.remove([p.path]);assert.equal(deniedDelete.data?.length??0,0)
  assert.ifError((await t.a.storage.from('garage-photos').download(p.path)).error)
  const env=loadGarageTestEnv();const anon=createClient(env.url,env.anonKey,{auth:{persistSession:false}})
  assert.ok((await anon.storage.from('garage-photos').download(p.path)).error)
  assert.ok((await anon.storage.from('garage-photos').createSignedUrl(p.path,60)).error)
  const saved=await finaliseFile(account,p,writer);assert.equal(saved.ok,true)
  assert.equal((await finaliseFile(account,p,writer)).ok,true)
  assert.equal((await t.a.from('garage_files').select('id').eq('id',p.id)).data?.length,1)
  assert.equal(await getPrivateFileUrl(foreign,p.id),null)
  assert.ok(await getPrivateFileUrl(account,p.id)) // legitimately issued URLs are temporary bearer links.
  const processed=await t.a.storage.from('garage-photos').download(p.path.replace('.source','.webp'));assert.ifError(processed.error)
  assert.equal((await sharp(Buffer.from(await processed.data!.arrayBuffer())).metadata()).exif,undefined)
  const bad=photo();await upload(bad,Buffer.from('corrupt'),'image/jpeg');assert.equal((await finaliseFile(account,bad,writer)).ok,false)
  assert.equal((await t.a.from('garage_bikes').select('photo_path').eq('id',bike).single()).data?.photo_path,p.path.replace('.source','.webp'))
  assert.ok((await t.a.storage.from('garage-photos').upload(p.path,photoBytes,{contentType:'image/jpeg',upsert:true})).error,'Active photo cannot reupload pending source after lost response')
  assert.ok((await t.a.storage.from('garage-photos').download(p.path)).error,'Stable retry leaves no source')
  const second=photo(otherBike);await upload(second,photoBytes,'image/jpeg');assert.equal((await finaliseFile(account,second,writer)).ok,true)
  const outageWriter=new Proxy(t.admin,{get(target,key){if(key==='storage') return {from:(name:string)=>new Proxy(target.storage.from(name),{get(bucket,method){if(method==='remove')return async()=>({data:null,error:{message:'Injected outage'}});return Reflect.get(bucket,method)}})};return Reflect.get(target,key)}})
  assert.equal((await restoreLibraryImage(account,bike,()=>outageWriter)).ok,false)
  assert.equal((await listPrivateFiles(account,bike)).some(file=>file.cleanupPending),true,'Reload reconstructs failed restoration cleanup')
  assert.equal((await retryBikePhotoCleanup(account,bike,writer)).ok,true)
  assert.equal((await t.a.from('garage_bikes').select('photo_path').eq('id',bike).single()).data?.photo_path,null)
  assert.equal((await t.a.from('garage_bikes').select('photo_path').eq('id',otherBike).single()).data?.photo_path,second.path.replace('.source','.webp'))
  assert.equal((await t.admin.from('motorcycles').select('image_url').eq('id',t.modelId).single()).data?.image_url,'/images/bikes/honda-cb650ra-2023.png')
  const sourceId=crypto.randomUUID()
  const sourceReceipt:FileInput={id:sourceId,bikeId:bike,jobId:job,kind:'receipt',path:`${t.userA}/jobs/${job}/${sourceId}.pdf.source`,filename:'source-cleanup.pdf'}
  await upload(sourceReceipt,pdf,'application/pdf')
  const sourceSaved=await finaliseFile(account,sourceReceipt,()=>outageWriter)
  assert.equal(sourceSaved.ok,true)
  assert.equal(sourceSaved.ok && 'cleanupPending' in sourceSaved.value?sourceSaved.value.cleanupPending:false,true,'Injected source removal failure is reported without losing attachment')
  const reloaded=(await listPrivateFiles(account,bike)).find(file=>file.id===sourceId)
  assert.equal(reloaded?.sourcePending,true,'Reload restores durable source cleanup state')
  assert.ok(await getPrivateFileUrl(account,sourceId),'Saved attachment remains downloadable')
  let foreignWriters=0
  assert.equal((await retryReceiptSourceCleanup(foreign,sourceId,()=>{foreignWriters++;return t.admin})).ok,false)
  assert.equal(foreignWriters,0,'Foreign owner cannot create cleanup writer')
  assert.equal((await retryReceiptSourceCleanup(account,sourceId,writer)).ok,true)
  const cleaned=(await listPrivateFiles(account,bike)).find(file=>file.id===sourceId)
  assert.equal(cleaned?.sourcePending,false);assert.equal(cleaned?.cleanupPending,false)
  assert.ifError((await t.a.storage.from('garage-receipts').download(sourceReceipt.path.replace('.source',''))).error)
  assert.ok((await t.a.storage.from('garage-receipts').download(sourceReceipt.path)).error,'Retry removes only pending source')
  assert.equal((await removePrivateFile(account,sourceId,writer)).ok,true)
  console.log('PASS: injected receipt source cleanup failure, durable reload, owner-only retry and retained final attachment')
  const receiptInputs:FileInput[]=[]
  for(let i=0;i<11;i++) {const id=crypto.randomUUID();const input:FileInput={id,bikeId:bike,jobId:job,kind:'receipt',path:`${t.userA}/jobs/${job}/${id}.pdf.source`,filename:'<script>receipt.pdf'};await upload(input,pdf,'application/pdf');receiptInputs.push(input)}
  // Concurrent finalisations exercise the job row lock and exact ten-file bound.
  const results=await Promise.all(receiptInputs.map(input=>finaliseFile(account,input,writer)))
  assert.equal(results.filter(r=>r.ok).length,10)
  assert.equal((await t.a.from('garage_files').select('id').eq('job_id',job)).data?.length,10)
  const attached=receiptInputs.find((_,i)=>results[i].ok)!
  assert.equal(await getPrivateFileUrl(foreign,attached.id),null)
  const url=await getPrivateFileUrl(account,attached.id);assert.ok(url)
  const download=await fetch(url!);assert.match(download.headers.get('content-disposition')??'',/attachment/)
  const corruptIdentity=await t.a.from('garage_files').update({bike_id:otherBike}).eq('id',attached.id);assert.ok(corruptIdentity.error)
  assert.equal((await removePrivateFile(foreign,attached.id,writer)).ok,false)
  assert.equal((await finaliseFile(foreign,attached,writer)).ok,false)
  assert.equal((await finaliseFile(account,attached,writer)).ok,true,'A stable retry succeeds even at the ten-file limit')
  assert.equal((await t.a.from('garage_files').select('id').eq('job_id',job)).data?.length,10)
  let announce!:()=>void;let resume!:()=>void
  const removing=new Promise<void>(resolve=>{announce=resolve});const proceed=new Promise<void>(resolve=>{resume=resolve})
  const pausedWriter=new Proxy(t.admin,{get(target,key){
   if(key==='storage') return {from:(name:string)=>new Proxy(target.storage.from(name),{get(bucket,method){if(method==='remove')return async(paths:string[])=>{announce();await proceed;return bucket.remove(paths)};return Reflect.get(bucket,method)}})}
   return Reflect.get(target,key)
  }})
  const removal=removePrivateFile(account,attached.id,()=>pausedWriter)
  await removing
  assert.ok((await t.a.storage.from('garage-receipts').upload(attached.path,pdf,{contentType:'application/pdf',upsert:true})).error,'Removal gate denies upload before byte deletion')
  assert.equal((await finaliseFile(account,attached,writer)).ok,false,'Removal gate denies overlapping finalize')
  resume();assert.equal((await removal).ok,true)
  assert.ok((await t.a.storage.from('garage-receipts').upload(attached.path,pdf,{contentType:'application/pdf',upsert:true})).error,'Removed identity refuses late source upload')
  assert.equal((await finaliseFile(account,attached,writer)).ok,false,'Removed identity refuses re-finalization')
  assert.equal((await t.a.from('garage_file_states').select('state').eq('id',attached.id).single()).data?.state,'removed')
  // Inject only the Storage outage; verify retained records in the real local database.
  const failingClient=new Proxy(t.admin,{get(target,key){
   if(key==='storage') return {from:(name:string)=>new Proxy(target.storage.from(name),{get(bucket,method){if(method==='remove')return async()=>({data:null,error:{message:'Injected Storage outage'}});return Reflect.get(bucket,method)}})}
   return Reflect.get(target,key)
  }})
  await assert.rejects(()=>cleanupOwnedFiles(account,bike,job,()=>failingClient),/kept/)
  assert.ok((await t.a.from('maintenance_jobs').select('id').eq('id',job).single()).data)
  assert.equal((await t.a.from('garage_files').select('id').eq('job_id',job)).data?.length,9)
  // Gate cleanup before hard removal; finalisation cannot race a deleted job/bike.
  await cleanupOwnedFiles(account,bike,job,writer)
  assert.equal((await t.a.storage.from('garage-receipts').list(`${t.userA}/jobs/${job}`)).data?.length,0,'Pending unattached uploads must be removed too')
  const lateId=crypto.randomUUID()
  assert.ok((await t.a.storage.from('garage-receipts').upload(`${t.userA}/jobs/${job}/${lateId}.pdf.source`,pdf,{contentType:'application/pdf'})).error,'Uploads must be refused after deletion begins')
  const retry=await finaliseFile(account,receiptInputs[10],writer);assert.equal(retry.ok,false)
  assert.ifError((await t.a.from('maintenance_jobs').delete().eq('id',job)).error)
  console.log('PASS: private Storage, two-account denial, bytes, stable retries, replacement/default isolation, atomic receipt limit and deletion gate')
 } finally {
  for(const entry of uploaded) await t.admin.storage.from(entry.bucket).remove([entry.path,entry.path.replace('.source','.webp')])
  for(const bikeId of [bike,otherBike]) await cleanupOwnedFiles(account,bikeId,null,writer).catch(()=>{})
  await t.a.from('garage_bikes').delete().in('id',[bike,otherBike])
  await t.cleanup()
 }
}
main().catch(error=>{console.error(error instanceof Error?error.message:'Storage verification failed');process.exitCode=1})
