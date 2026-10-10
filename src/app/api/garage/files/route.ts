import { getAccount } from '@/lib/account'
import { FileError,finaliseFileOrThrow,getPrivateFileUrl,removePrivateFile,restoreLibraryImage,retryBikePhotoCleanup } from '@/lib/maintenance/uploads.server'
import { requireJobId } from '@/lib/maintenance/validation'
export const dynamic='force-dynamic'
export const runtime='nodejs'
function response(body:unknown,status=200) {return Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}})}
function failed(error:unknown) {return response({message:error instanceof FileError?error.message:'Could not save the file. Retry.'},error instanceof FileError?error.status:500)}
async function json(request:Request) {
 try {return await request.json()} catch {throw new FileError(400,'Invalid file details.')}
}
function identifier(input:unknown):string {try {return requireJobId(input)} catch {throw new FileError(400,'Invalid file identifier.')}}
export async function POST(request:Request) {
 const account=await getAccount();if(!account) return response({message:'Sign in to save files.'},401)
 try {
  const input=await json(request)
  if(input?.cleanup===true) {
   if(Object.keys(input).some(key=>!['bikeId','cleanup'].includes(key))) throw new FileError(400,'Invalid file details.')
   const result=await retryBikePhotoCleanup(account,identifier(input.bikeId))
   return result.ok?response(result):response({message:result.message},result.error==='not_found'?404:500)
  }
  return response(await finaliseFileOrThrow(account,input))
 } catch(error) {return failed(error)}
}
export async function GET(request:Request) {
 const account=await getAccount();if(!account) return response({message:'Sign in to download files.'},401)
 try {
  const id=identifier(new URL(request.url).searchParams.get('fileId'))
  const url=await getPrivateFileUrl(account,id)
  return url?response({url,expiresIn:60}):response({message:'File not found.'},404)
 } catch(error) {return failed(error)}
}
export async function DELETE(request:Request) {
 const account=await getAccount();if(!account) return response({message:'Sign in to remove files.'},401)
 try {
  const input=await json(request)
  if(!input || typeof input!=='object') throw new FileError(400,'Invalid file details.')
  if(input.restoreDefault===true && input.confirmed!==true) throw new FileError(400,'Confirm restoration first.')
  const result=input.restoreDefault===true?await restoreLibraryImage(account,identifier(input.bikeId)):await removePrivateFile(account,identifier(input.fileId))
  return result.ok?response(result):response({message:result.message},result.error==='not_found'?404:result.error==='invalid'?400:result.error==='conflict'?409:500)
 } catch(error) {return failed(error)}
}
