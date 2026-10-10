import sharp from 'sharp'
import type { AccountContext } from '@/lib/account'
import type { Json, Tables } from '@/types/database.types'
import type { FileInput, PrivateFile, SavedResult } from './types'
import { requireJobId } from './validation'

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
  return 'application/pdf'
 }
 const {image,format}=await decodedImage(buffer)
 if(({jpg:'jpeg',png:'png',webp:'webp'} as Record<string,string>)[extension]!==format) throw new FileError(415,'The receipt contents do not match its type.')
 try {await image.stats()} catch {throw new FileError(415,'The receipt image is corrupt.')}
 return `image/${format}`
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
 if(photo ? input.path!==expected : !['jpg','png','webp','pdf'].some(ext=>input.path===`${expected}.${ext}`)) throw new FileError(400,'Invalid upload path.')
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
async function deleteStoredRow(account:AccountContext,row:Tables<'garage_files'>) {
 const paths=[row.path]
 if(row.kind==='bike_photo') paths.push(row.path.replace(/\.webp$/,'.source'))
 const {error}=await account.client.storage.from(bucketFor(row.kind as FileInput['kind'])).remove(paths)
 if(error) throw new FileError(500,'File cleanup failed. The record and file references are kept. Retry removal.')
 const removed=await account.client.from('garage_files').delete().eq('owner_id',account.userId).eq('id',row.id).eq('cleanup_pending',true)
 if(removed.error) throw new FileError(500,'File cleanup needs another retry. The file references are kept.')
}
async function tidyPhoto(account:AccountContext,row:Tables<'garage_files'>) {
 if(row.source_pending) {
  const {error}=await account.client.storage.from('garage-photos').remove([row.path.replace(/\.webp$/,'.source')])
  if(error) throw new FileError(500,'Photo saved. Retry saving to finish source cleanup.')
  const update=await account.client.from('garage_files').update({source_pending:false}).eq('owner_id',account.userId).eq('id',row.id)
  if(update.error) throw new FileError(500,'Photo saved. Retry saving to finish source cleanup.')
 }
 const old=await account.client.from('garage_files').select('*').eq('owner_id',account.userId).eq('bike_id',row.bike_id).eq('kind','bike_photo').eq('cleanup_pending',true)
 if(old.error) throw new FileError(500,'Photo saved. Retry to finish previous photo cleanup.')
 for(const obsolete of old.data??[]) await deleteStoredRow(account,obsolete)
}
// The route uses the throwing variant to preserve HTTP status for validation failures.
export async function finaliseFileOrThrow(account:AccountContext,raw:unknown):Promise<{id:string;path:string;cleanupPending?:boolean}> {
 const input=parseFileInput(raw,account.userId)
 await ownedTarget(account,input)
 const existing=await fileRow(account,input.id)
 const finalPath=input.kind==='bike_photo'?input.path.replace(/\.source$/,'.webp'):input.path
 if(existing) {
  if(existing.bike_id!==input.bikeId || existing.job_id!==input.jobId || existing.path!==finalPath || existing.kind!==input.kind || existing.cleanup_pending) throw new FileError(409,'File identifier already used.')
  let cleanupPending=false
  if(input.kind==='bike_photo') {try {await tidyPhoto(account,existing)} catch {cleanupPending=true}}
  return {id:existing.id,path:existing.path,...(cleanupPending?{cleanupPending:true}:{})}
 }
 const bytes=await readOwnedUpload(account,input)
 if(input.kind==='bike_photo') {
  const processed=await normaliseBikePhoto(bytes)
  const {error}=await account.client.storage.from('garage-photos').upload(finalPath,processed,{contentType:'image/webp',upsert:true})
  if(error) throw new FileError(500,'Could not save the photo. The previous image is kept.')
 } else await validateReceipt(bytes,input.path.split('.').pop()!)
 const {data,error}=await account.client.rpc('attach_garage_file',{p_input:{...input,path:finalPath} as Json})
 if(error || !data) throw rpcError(error??{})
 let cleanupPending=false
 if(input.kind==='bike_photo') {try {await tidyPhoto(account,data)} catch {cleanupPending=true}}
 return {id:data.id,path:data.path,...(cleanupPending?{cleanupPending:true}:{})}
}
export async function finaliseFile(account:AccountContext,input:FileInput):Promise<SavedResult<{id:string;path:string}>> {
 try {return {ok:true,value:await finaliseFileOrThrow(account,input)}} catch(error) {return savedFailure(error)}
}
export async function listPrivateFiles(account:AccountContext,bikeId:string):Promise<PrivateFile[]> {
 const {data,error}=await account.client.from('garage_files').select('*').eq('owner_id',account.userId).eq('bike_id',requireJobId(bikeId)).order('created_at')
 if(error) throw new FileError(500,'Could not load private files.')
 return (data??[]).map(row=>({id:row.id,bikeId:row.bike_id,jobId:row.job_id,kind:row.kind as FileInput['kind'],path:row.path,filename:row.filename,cleanupPending:row.cleanup_pending}))
}
export async function getPrivateFileUrl(account:AccountContext,fileId:string):Promise<string|null> {
 const row=await fileRow(account,fileId)
 if(!row || row.cleanup_pending) return null
 const {data,error}=await account.client.storage.from(bucketFor(row.kind as FileInput['kind'])).createSignedUrl(row.path,60,row.kind==='receipt'?{download:true}:undefined)
 if(error) throw new FileError(500,'Could not create a download link. Retry.')
 return data.signedUrl
}
export async function removePrivateFile(account:AccountContext,fileId:string):Promise<SavedResult<null>> {
 try {
  requireJobId(fileId)
  const {data,error}=await account.client.rpc('begin_file_removal',{p_file_id:fileId})
  if(error || !data) throw rpcError(error??{})
  await deleteStoredRow(account,data)
  return {ok:true,value:null}
 } catch(error) {return savedFailure(error)}
}
export async function restoreLibraryImage(account:AccountContext,bikeId:string):Promise<SavedResult<null>> {
 try {
  requireJobId(bikeId)
  const {error}=await account.client.rpc('restore_garage_image',{p_bike_id:bikeId})
  if(error) throw rpcError(error)
  const files=await account.client.from('garage_files').select('*').eq('owner_id',account.userId).eq('bike_id',bikeId).eq('kind','bike_photo').eq('cleanup_pending',true)
  if(files.error) throw new FileError(500,'Library image restored. Retry to finish cleanup.')
  for(const file of files.data??[]) await deleteStoredRow(account,file)
  return {ok:true,value:null}
 } catch(error) {return savedFailure(error)}
}
export async function cleanupOwnedFiles(account:AccountContext,bikeId:string,jobId:string|null=null):Promise<void> {
 requireJobId(bikeId);if(jobId) requireJobId(jobId)
 const {error}=await account.client.rpc('begin_garage_cleanup',{p_bike_id:bikeId,p_job_id:jobId??undefined})
 if(error) throw rpcError(error)
 let query=account.client.from('garage_files').select('*').eq('owner_id',account.userId).eq('bike_id',bikeId)
 if(jobId) query=query.eq('job_id',jobId)
 const files=await query
 if(files.error) throw new FileError(500,'Could not load cleanup references. Retry removal.')
 // Include failed/cancelled pending objects, which have no attachment row yet.
 const prefixes:{bucket:string;path:string}[]=[]
 if(!jobId) prefixes.push({bucket:'garage-photos',path:`${account.userId}/bikes/${bikeId}`})
 let jobIds=[jobId].filter((id):id is string=>id!==null)
 if(!jobId) {
  const jobs=await account.client.from('maintenance_jobs').select('id').eq('owner_id',account.userId).eq('bike_id',bikeId)
  if(jobs.error) throw new FileError(500,'Could not load cleanup references. Retry removal.')
  jobIds=(jobs.data??[]).map(job=>job.id)
 }
 for(const id of jobIds) prefixes.push({bucket:'garage-receipts',path:`${account.userId}/jobs/${id}`})
 for(const prefix of prefixes) {
  // The database gate prevents new objects. Repeated first-page deletion avoids skipped rows.
  while(true) {
   const bucket=account.client.storage.from(prefix.bucket)
   const listed=await bucket.list(prefix.path,{limit:100})
   if(listed.error) throw new FileError(500,'File cleanup failed. The record and file references are kept. Retry removal.')
   if(!listed.data.length) break
   const removed=await bucket.remove(listed.data.map(object=>`${prefix.path}/${object.name}`))
   if(removed.error) throw new FileError(500,'File cleanup failed. The record and file references are kept. Retry removal.')
  }
 }
 for(const file of files.data??[]) await deleteStoredRow(account,file)
}
