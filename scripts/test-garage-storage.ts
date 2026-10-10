import assert from 'node:assert/strict'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'
import { createLocalTestClients, loadGarageTestEnv } from './garage-test-env'
import { finaliseFile, getPrivateFileUrl, removePrivateFile, cleanupOwnedFiles, restoreLibraryImage } from '../src/lib/maintenance/uploads.server'
import type { FileInput } from '../src/lib/maintenance/types'

async function main() {
 const t=await createLocalTestClients();const account={client:t.a,userId:t.userA};const foreign={client:t.b,userId:t.userB}
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
  const saved=await finaliseFile(account,p);assert.equal(saved.ok,true)
  assert.equal((await finaliseFile(account,p)).ok,true)
  assert.equal((await t.a.from('garage_files').select('id').eq('id',p.id)).data?.length,1)
  assert.equal(await getPrivateFileUrl(foreign,p.id),null)
  assert.ok(await getPrivateFileUrl(account,p.id)) // legitimately issued URLs are temporary bearer links.
  const processed=await t.a.storage.from('garage-photos').download(p.path.replace('.source','.webp'));assert.ifError(processed.error)
  assert.equal((await sharp(Buffer.from(await processed.data!.arrayBuffer())).metadata()).exif,undefined)
  const bad=photo();await upload(bad,Buffer.from('corrupt'),'image/jpeg');assert.equal((await finaliseFile(account,bad)).ok,false)
  assert.equal((await t.a.from('garage_bikes').select('photo_path').eq('id',bike).single()).data?.photo_path,p.path.replace('.source','.webp'))
  const second=photo(otherBike);await upload(second,photoBytes,'image/jpeg');assert.equal((await finaliseFile(account,second)).ok,true)
  assert.equal((await restoreLibraryImage(account,bike)).ok,true)
  assert.equal((await t.a.from('garage_bikes').select('photo_path').eq('id',bike).single()).data?.photo_path,null)
  assert.equal((await t.a.from('garage_bikes').select('photo_path').eq('id',otherBike).single()).data?.photo_path,second.path.replace('.source','.webp'))
  assert.equal((await t.admin.from('motorcycles').select('image_url').eq('id',t.modelId).single()).data?.image_url,'/images/bikes/honda-cb650ra-2023.png')
  const receiptInputs:FileInput[]=[]
  for(let i=0;i<11;i++) {const id=crypto.randomUUID();const input:FileInput={id,bikeId:bike,jobId:job,kind:'receipt',path:`${t.userA}/jobs/${job}/${id}.pdf`,filename:'<script>receipt.pdf'};await upload(input,Buffer.from('%PDF-1.7\nreceipt\n%%EOF'),'application/pdf');receiptInputs.push(input)}
  // Concurrent finalisations exercise the job row lock and exact ten-file bound.
  const results=await Promise.all(receiptInputs.map(input=>finaliseFile(account,input)))
  assert.equal(results.filter(r=>r.ok).length,10)
  assert.equal((await t.a.from('garage_files').select('id').eq('job_id',job)).data?.length,10)
  const attached=receiptInputs.find((_,i)=>results[i].ok)!
  assert.equal(await getPrivateFileUrl(foreign,attached.id),null)
  const url=await getPrivateFileUrl(account,attached.id);assert.ok(url)
  const download=await fetch(url!);assert.match(download.headers.get('content-disposition')??'',/attachment/)
  const corruptIdentity=await t.a.from('garage_files').update({bike_id:otherBike}).eq('id',attached.id);assert.ok(corruptIdentity.error)
  assert.equal((await removePrivateFile(foreign,attached.id)).ok,false)
  assert.equal((await finaliseFile(foreign,attached)).ok,false)
  assert.equal((await finaliseFile(account,attached)).ok,true,'A stable retry succeeds even at the ten-file limit')
  assert.equal((await t.a.from('garage_files').select('id').eq('job_id',job)).data?.length,10)
  assert.equal((await removePrivateFile(account,attached.id)).ok,true)
  // Inject only the Storage outage; verify retained records in the real local database.
  const failingClient=new Proxy(t.a,{get(target,key){
   if(key==='storage') return {from:(name:string)=>new Proxy(target.storage.from(name),{get(bucket,method){if(method==='remove')return async()=>({data:null,error:{message:'Injected Storage outage'}});return Reflect.get(bucket,method)}})}
   return Reflect.get(target,key)
  }})
  await assert.rejects(()=>cleanupOwnedFiles({client:failingClient,userId:t.userA},bike,job),/kept/)
  assert.ok((await t.a.from('maintenance_jobs').select('id').eq('id',job).single()).data)
  assert.equal((await t.a.from('garage_files').select('id').eq('job_id',job)).data?.length,9)
  // Gate cleanup before hard removal; finalisation cannot race a deleted job/bike.
  await cleanupOwnedFiles(account,bike,job)
  assert.equal((await t.a.storage.from('garage-receipts').list(`${t.userA}/jobs/${job}`)).data?.length,0,'Pending unattached uploads must be removed too')
  const lateId=crypto.randomUUID()
  assert.ok((await t.a.storage.from('garage-receipts').upload(`${t.userA}/jobs/${job}/${lateId}.pdf`,Buffer.from('%PDF-1.7\nreceipt\n%%EOF'),{contentType:'application/pdf'})).error,'Uploads must be refused after deletion begins')
  const retry=await finaliseFile(account,receiptInputs[10]);assert.equal(retry.ok,false)
  assert.ifError((await t.a.from('maintenance_jobs').delete().eq('id',job)).error)
  console.log('PASS: private Storage, two-account denial, bytes, stable retries, replacement/default isolation, atomic receipt limit and deletion gate')
 } finally {
  for(const entry of uploaded) await t.admin.storage.from(entry.bucket).remove([entry.path,entry.path.replace('.source','.webp')])
  for(const bikeId of [bike,otherBike]) await cleanupOwnedFiles(account,bikeId).catch(()=>{})
  await t.a.from('garage_bikes').delete().in('id',[bike,otherBike])
  await t.cleanup()
 }
}
main().catch(error=>{console.error(error instanceof Error?error.message:'Storage verification failed');process.exitCode=1})
