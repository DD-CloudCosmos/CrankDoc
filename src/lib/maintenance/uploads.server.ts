import sharp from 'sharp'
import {Worker} from 'node:worker_threads'
import type {SupabaseClient} from '@supabase/supabase-js'
import {createServiceClient} from '@/lib/supabase/server'
import type { AccountContext } from '@/lib/account'
import type { Database, Json, Tables } from '@/types/database.types'
import type { FileInput, PrivateFile, SavedResult } from './types'
import { requireJobId } from './validation'

type FileWriter=()=>SupabaseClient<Database>
const maxBytes=10*1024*1024
export class FileError extends Error {
 constructor(public status:number,message:string) {super(message)}
}
function limit(buffer:Buffer) {
 if(buffer.length>maxBytes) throw new FileError(413,'Files must be at most 10 MiB.')
 if(!buffer.length) throw new FileError(415,'The file is empty.')
}
async function decodedImage(buffer:Buffer) {
 limit(buffer)
 try {
  const image=sharp(buffer,{limitInputPixels:40_000_000})
  const metadata=await image.metadata()
  if(!['jpeg','png','webp'].includes(metadata.format??'') || (metadata.pages??1)>1) throw new FileError(415,'Choose a JPEG, PNG or WebP image.')
  return {image,format:metadata.format!}
 } catch(error) {
  if(error instanceof FileError) throw error
  if(error instanceof Error && /pixel limit/i.test(error.message)) throw new FileError(413,'Images must be at most 40 million pixels.')
  throw new FileError(415,'The image is corrupt or unsupported.')
 }
}
export async function normaliseBikePhoto(buffer:Buffer):Promise<Buffer> {
 const {image}=await decodedImage(buffer)
 try {return await image.rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer()}
 catch {throw new FileError(415,'The image is corrupt or unsupported.')}
}
export async function validateReceipt(buffer:Buffer,extension:string):Promise<string> {
 limit(buffer)
 if(extension==='pdf') {
  if(!/^%PDF-1\.[0-7]|^%PDF-2\.0/.test(buffer.subarray(0,8).toString('ascii')) || !/%%EOF\s*$/.test(buffer.subarray(-1024).toString('ascii'))) throw new FileError(415,'The receipt is not a PDF.')
  await structuralPdf(buffer)
  return 'application/pdf'
 }
 const {image,format}=await decodedImage(buffer)
 if(({jpg:'jpeg',png:'png',webp:'webp'} as Record<string,string>)[extension]!==format) throw new FileError(415,'The receipt contents do not match its type.')
 try {await image.stats()} catch {throw new FileError(415,'The receipt image is corrupt.')}
 return `image/${format}`
}
async function structuralPdf(buffer:Buffer):Promise<void> {
 await new Promise<void>((resolve,reject)=>{
  const worker=new Worker(`
   const {parentPort,workerData}=require('node:worker_threads');
   const {createRequire}=require('node:module');
   const {PDFDocument}=createRequire(workerData.root+'/package.json')('pdf-lib');
   PDFDocument.load(workerData.bytes,{ignoreEncryption:false,throwOnInvalidObject:true,updateMetadata:false}).then(pdf=>{
    if(pdf.getPageCount()<1) throw new Error('Missing pages');
    for(const page of pdf.getPages()) {const size=page.getSize();if(!Number.isFinite(size.width)||!Number.isFinite(size.height)||size.width<=0||size.height<=0)throw new Error('Invalid page');}
    parentPort.postMessage(true);
   }).catch(()=>parentPort.postMessage(false));
  `,{eval:true,workerData:{root:process.cwd(),bytes:new Uint8Array(buffer)},resourceLimits:{maxOldGenerationSizeMb:128,maxYoungGenerationSizeMb:16}})
  const finish=(valid:boolean)=>{clearTimeout(timer);void worker.terminate();if(valid)resolve();else reject(new FileError(415,'The PDF is corrupt, encrypted or too complex.'))}
  const timer=setTimeout(()=>finish(false),5000)
  worker.once('message',finish);worker.once('error',()=>finish(false));worker.once('exit',code=>{if(code!==0)finish(false)})
 })
}
export function parseFileInput(value:unknown,userId:string):FileInput {
 if(!value || typeof value!=='object' || Array.isArray(value)) throw new FileError(400,'Invalid file details.')
 const input=value as Record<string,unknown>
 if(Object.keys(input).some(key=>!['id','kind','bikeId','jobId','path','filename'].includes(key))) throw new FileError(400,'Invalid file details.')
 try {requireJobId(input.id);requireJobId(input.bikeId);if(input.jobId!==null) requireJobId(input.jobId)} catch {throw new FileError(400,'Invalid file identifier.')}
 if(!['bike_photo','receipt'].includes(String(input.kind)) || typeof input.filename!=='string' || !input.filename.trim() || input.filename.length>255 || typeof input.path!=='string') throw new FileError(400,'Invalid file details.')
 const photo=input.kind==='bike_photo'
 if(photo ? input.jobId!==null : input.jobId===null) throw new FileError(400,'Invalid file target.')
 const expected=photo?`${userId}/bikes/${input.bikeId}/${input.id}.source`:`${userId}/jobs/${input.jobId}/${input.id}`
 if(photo ? input.path!==expected : !['jpg','png','webp','pdf'].some(ext=>input.path===`${expected}.${ext}.source`)) throw new FileError(400,'Invalid upload path.')
 return input as FileInput
}
async function ownedTarget(account:AccountContext,input:FileInput) {
 const bike=await account.client.from('garage_bikes').select('id,file_cleanup_pending').eq('owner_id',account.userId).eq('id',input.bikeId).maybeSingle()
 if(bike.error) throw new FileError(500,'Could not check the bike.')
 if(!bike.data) throw new FileError(404,'File target not found.')
 if(bike.data.file_cleanup_pending) throw new FileError(409,'Bike removal needs cleanup. Retry removal first.')
 if(input.jobId) {
  const job=await account.client.from('maintenance_jobs').select('id,file_cleanup_pending').eq('owner_id',account.userId).eq('bike_id',input.bikeId).eq('id',input.jobId).maybeSingle()
  if(job.error) throw new FileError(500,'Could not check the job.')
  if(!job.data) throw new FileError(404,'File target not found.')
  if(job.data.file_cleanup_pending) throw new FileError(409,'Job removal needs cleanup. Retry removal first.')
 }
}
const bucketFor=(kind:FileInput['kind'])=>kind==='bike_photo'?'garage-photos':'garage-receipts'
export async function readOwnedUpload(account:AccountContext,input:FileInput):Promise<Buffer> {
 input=parseFileInput(input,account.userId)
 await ownedTarget(account,input)
 const {data,error}=await account.client.storage.from(bucketFor(input.kind)).download(input.path)
 if(error || !data) throw new FileError(404,'Uploaded file not found. Retry the upload.')
 if(data.size>maxBytes) throw new FileError(413,'Files must be at most 10 MiB.')
 const bytes=Buffer.from(await data.arrayBuffer());limit(bytes);return bytes
}
function savedFailure<T>(error:unknown):SavedResult<T> {
 if(error instanceof FileError) return {ok:false,error:error.status===404?'not_found':error.status===409?'conflict':error.status<500?'invalid':'save_failed',message:error.message}
 return {ok:false,error:'save_failed',message:'Could not save the file. Retry with the same selection.'}
}
function rpcError(error:{code?:string;message?:string}) {
 return new FileError(['PT404','23505'].includes(error.code??'')?404:error.code==='PT409'?409:error.code?.startsWith('22')||error.code?.startsWith('23')?400:500,error.code==='PT409'?error.message??'File changed. Retry.':['PT404','23505'].includes(error.code??'')?'File target not found.':'Could not save the file.')
}
async function fileRow(account:AccountContext,id:string) {
 const {data,error}=await account.client.from('garage_files').select('*').eq('owner_id',account.userId).eq('id',requireJobId(id)).maybeSingle()
 if(error) throw new FileError(500,'Could not load files.')
 return data
}
function finalPath(input:FileInput) {return input.kind==='bike_photo'?input.path.replace(/\.source$/,'.webp'):input.path.replace(/\.source$/,'')}
function sourcePath(kind:string,path:string) {return kind==='bike_photo'?path.replace(/\.webp$/,'.source'):`${path}.source`}
async function deleteStoredRow(account:AccountContext,row:Pick<Tables<'garage_file_states'>,'id'|'kind'|'path'>,writer:SupabaseClient<Database>) {
 const {error}=await writer.storage.from(bucketFor(row.kind as FileInput['kind'])).remove([row.path,sourcePath(row.kind,row.path)])
 if(error) throw new FileError(500,'File cleanup failed. The record and file references are kept. Retry removal.')
 const removed=await writer.rpc('finish_garage_file_removal',{p_owner_id:account.userId,p_file_id:row.id})
 if(removed.error) throw rpcError(removed.error)
}
async function tidyFile(account:AccountContext,row:Tables<'garage_files'>,writer:SupabaseClient<Database>) {
 // Always reconcile the deterministic source, including response-lost and concurrent retries.
 const mark=await writer.from('garage_files').update({source_pending:true}).eq('owner_id',account.userId).eq('id',row.id)
 if(mark.error) throw new FileError(500,'File saved. Source cleanup needs retry.')
 const removed=await writer.storage.from(bucketFor(row.kind as FileInput['kind'])).remove([sourcePath(row.kind,row.path)])
 if(removed.error) throw new FileError(500,'File saved. Source cleanup needs retry.')
 const update=await writer.from('garage_files').update({source_pending:false}).eq('owner_id',account.userId).eq('id',row.id)
 if(update.error) throw new FileError(500,'File saved. Source cleanup needs retry.')
 if(row.kind==='bike_photo') {
  while(true) {
   const old=await account.client.from('garage_files').select('*').eq('owner_id',account.userId).eq('bike_id',row.bike_id).eq('kind','bike_photo').eq('cleanup_pending',true).order('id').limit(1000)
   if(old.error) throw new FileError(500,'Photo saved. Previous cleanup needs retry.')
   if(!old.data?.length)break
   for(const obsolete of old.data)await deleteStoredRow(account,obsolete,writer)
  }
 }
}
// Only this transition and cleanup use a server writer. Owner checks precede its creation.
export async function finaliseFileOrThrow(account:AccountContext,raw:unknown,createWriter:FileWriter=createServiceClient):Promise<{id:string;path:string;cleanupPending?:boolean}> {
 const input=parseFileInput(raw,account.userId)
 await ownedTarget(account,input)
 const path=finalPath(input)
 const writer=createWriter()
 const transition=await writer.rpc('begin_garage_finalisation',{p_owner_id:account.userId,p_input:{...input,path} as Json})
 if(transition.error) throw rpcError(transition.error)
 const existing=await fileRow(account,input.id)
 if(existing) {
  if(existing.bike_id!==input.bikeId || existing.job_id!==input.jobId || existing.path!==path || existing.kind!==input.kind || existing.cleanup_pending) throw new FileError(404,'File target not found.')
  let cleanupPending=false
  try {await tidyFile(account,existing,writer)} catch {cleanupPending=true}
  return {id:existing.id,path:existing.path,...(cleanupPending?{cleanupPending:true}:{})}
 }
 try {
  const bytes=await readOwnedUpload(account,input)
  const processed=input.kind==='bike_photo'?await normaliseBikePhoto(bytes):bytes
  const type=input.kind==='bike_photo'?'image/webp':await validateReceipt(bytes,path.split('.').pop()!)
  const uploaded=await writer.storage.from(bucketFor(input.kind)).upload(path,processed,{contentType:type,upsert:false})
  if(uploaded.error) {
   // A concurrent trusted finalisation can have inserted the same immutable bytes.
   const stored=await account.client.storage.from(bucketFor(input.kind)).download(path)
   if(stored.error || !stored.data || !Buffer.from(await stored.data.arrayBuffer()).equals(processed)) throw new FileError(500,'Could not save the file. The previous image is kept.')
  }
  const {data,error}=await writer.rpc('attach_garage_file',{p_owner_id:account.userId,p_input:{...input,path} as Json})
  if(error || !data) throw rpcError(error??{})
  let cleanupPending=false
  try {await tidyFile(account,data,writer)} catch {cleanupPending=true}
  return {id:data.id,path:data.path,...(cleanupPending?{cleanupPending:true}:{})}
 } catch(error) {
  // Release only if no final bytes/metadata exist; the database checks under the same locks.
  await writer.rpc('release_garage_finalisation',{p_owner_id:account.userId,p_file_id:input.id})
  throw error
 }
}
export async function finaliseFile(account:AccountContext,input:FileInput,createWriter:FileWriter=createServiceClient):Promise<SavedResult<{id:string;path:string}>> {
 try {return {ok:true,value:await finaliseFileOrThrow(account,input,createWriter)}} catch(error) {return savedFailure(error)}
}
/** Live attachments only. Removed identities remain in a separate tombstone table. */
export async function listPrivateFiles(account:AccountContext,bikeId:string):Promise<PrivateFile[]> {
 const id=requireJobId(bikeId)
 const files:PrivateFile[]=[]
 while(true) {
  const {data,error}=await account.client.from('garage_files').select('*').eq('owner_id',account.userId).eq('bike_id',id).order('created_at').order('id').range(files.length,files.length+999)
  if(error) throw new FileError(500,'Could not load private files.')
  if(!data?.length) return files
  files.push(...data.map(row=>({id:row.id,bikeId:row.bike_id,jobId:row.job_id,kind:row.kind as FileInput['kind'],path:row.path,filename:row.filename,cleanupPending:row.cleanup_pending,sourcePending:row.source_pending})))
 }
}
export async function getPrivateFileUrl(account:AccountContext,fileId:string):Promise<string|null> {
 const row=await fileRow(account,fileId)
 if(!row || row.cleanup_pending) return null
 const {data,error}=await account.client.storage.from(bucketFor(row.kind as FileInput['kind'])).createSignedUrl(row.path,60,row.kind==='receipt'?{download:true}:undefined)
 if(error) throw new FileError(500,'Could not create a download link. Retry.')
 return data.signedUrl
}
export async function removePrivateFile(account:AccountContext,fileId:string,createWriter:FileWriter=createServiceClient):Promise<SavedResult<null>> {
 try {
  const owned=await fileRow(account,fileId)
  if(!owned) throw new FileError(404,'File not found.')
  const writer=createWriter()
  const {data,error}=await writer.rpc('begin_file_removal',{p_owner_id:account.userId,p_file_id:fileId})
  if(error || !data) throw rpcError(error??{})
  await deleteStoredRow(account,data,writer)
  return {ok:true,value:null}
 } catch(error) {return savedFailure(error)}
}
export async function retryBikePhotoCleanup(account:AccountContext,bikeId:string,createWriter:FileWriter=createServiceClient):Promise<SavedResult<null>> {
 try {
  await ownedTarget(account,{id:bikeId,bikeId,jobId:null,kind:'bike_photo',path:'',filename:''})
  const files=await listPrivateFiles(account,bikeId)
  const writer=createWriter()
  for(const file of files) if(file.kind==='bike_photo' && !file.cleanupPending && file.sourcePending) {const row=await fileRow(account,file.id);if(row)await tidyFile(account,row,writer)}
  while(true) {
   const states=await account.client.from('garage_file_states').select('*').eq('owner_id',account.userId).eq('bike_id',bikeId).eq('kind','bike_photo').eq('state','removing').order('id').limit(1000)
   if(states.error) throw new FileError(500,'Could not load cleanup references.')
   if(!states.data?.length)break
   for(const state of states.data)await deleteStoredRow(account,state,writer)
  }
  return {ok:true,value:null}
 } catch(error) {return savedFailure(error)}
}
export async function restoreLibraryImage(account:AccountContext,bikeId:string,createWriter:FileWriter=createServiceClient):Promise<SavedResult<null>> {
 try {
  requireJobId(bikeId)
  await ownedTarget(account,{id:bikeId,bikeId,jobId:null,kind:'bike_photo',path:'',filename:''})
  const {error}=await createWriter().rpc('restore_garage_image',{p_owner_id:account.userId,p_bike_id:bikeId})
  if(error) throw rpcError(error)
  return await retryBikePhotoCleanup(account,bikeId,createWriter)
 } catch(error) {return savedFailure(error)}
}
export async function cleanupOwnedFiles(account:AccountContext,bikeId:string,jobId:string|null=null,createWriter:FileWriter=createServiceClient):Promise<void> {
 requireJobId(bikeId);if(jobId) requireJobId(jobId)
 // Cleanup retries must remain possible after the parent gate was already set.
 const bike=await account.client.from('garage_bikes').select('id').eq('owner_id',account.userId).eq('id',bikeId).maybeSingle()
 if(bike.error || !bike.data) throw new FileError(404,'File target not found.')
 if(jobId) {
  const job=await account.client.from('maintenance_jobs').select('id').eq('owner_id',account.userId).eq('bike_id',bikeId).eq('id',jobId).maybeSingle()
  if(job.error || !job.data) throw new FileError(404,'File target not found.')
 }
 const writer=createWriter()
 const {error}=await writer.rpc('begin_garage_cleanup',{p_owner_id:account.userId,p_bike_id:bikeId,p_job_id:jobId??undefined})
 if(error) throw rpcError(error)
 const prefixes:{bucket:string;path:string}[]=[]
 if(!jobId) prefixes.push({bucket:'garage-photos',path:`${account.userId}/bikes/${bikeId}`})
 const jobIds=[jobId].filter((id):id is string=>id!==null)
 if(!jobId) {
  while(true) {
   const jobs=await account.client.from('maintenance_jobs').select('id').eq('owner_id',account.userId).eq('bike_id',bikeId).order('id').range(jobIds.length,jobIds.length+999)
   if(jobs.error) throw new FileError(500,'Could not load cleanup references. Retry removal.')
   if(!jobs.data?.length)break
   jobIds.push(...jobs.data.map(job=>job.id))
  }
 }
 for(const id of jobIds) prefixes.push({bucket:'garage-receipts',path:`${account.userId}/jobs/${id}`})
 for(const prefix of prefixes) {
  while(true) {
   const listed=await account.client.storage.from(prefix.bucket).list(prefix.path,{limit:100})
   if(listed.error) throw new FileError(500,'File cleanup failed. The record and file references are kept. Retry removal.')
   if(!listed.data.length) break
   const removed=await writer.storage.from(prefix.bucket).remove(listed.data.map(object=>`${prefix.path}/${object.name}`))
   if(removed.error) throw new FileError(500,'File cleanup failed. The record and file references are kept. Retry removal.')
  }
 }
 // Each successful removal changes its state: drain the first page, without offsets.
 while(true) {
  let query=account.client.from('garage_file_states').select('*').eq('owner_id',account.userId).eq('bike_id',bikeId).eq('state','removing').order('id').limit(1000)
  if(jobId)query=query.eq('job_id',jobId)
  const states=await query
  if(states.error)throw new FileError(500,'Could not load cleanup references. Retry removal.')
  if(!states.data?.length)break
  for(const state of states.data)await deleteStoredRow(account,state,writer)
 }
}
export async function retryReceiptSourceCleanup(account:AccountContext,fileId:string,createWriter:FileWriter=createServiceClient):Promise<SavedResult<null>> {
 try {
  const row=await fileRow(account,fileId)
  if(!row || row.kind!=='receipt' || row.cleanup_pending) throw new FileError(404,'File not found.')
  await ownedTarget(account,{id:row.id,bikeId:row.bike_id,jobId:row.job_id,kind:'receipt',path:row.path,filename:row.filename})
  if(row.source_pending) await tidyFile(account,row,createWriter())
  return {ok:true,value:null}
 } catch(error) {return savedFailure(error)}
}
