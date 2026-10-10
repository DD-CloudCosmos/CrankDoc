import {createAuthBrowserClient} from '@/lib/supabase/auth-browser'
import type {FileInput} from './types'
export async function privateFileRequest(method:'POST'|'GET'|'DELETE',input:unknown):Promise<{id?:string;path?:string;url?:string;expiresIn?:number;cleanupPending?:boolean}> {
 const url=method==='GET'?`/api/garage/files?fileId=${encodeURIComponent(String(input))}`:'/api/garage/files'
 const response=await fetch(url,{method,cache:'no-store',...(method==='GET'?{}:{headers:{'Content-Type':'application/json'},body:JSON.stringify(input)})})
 const result=await response.json()
 if(!response.ok) throw new Error(result.message??'Could not save the file. Retry.')
 return result
}
export async function uploadPrivateFile(owner:string,input:FileInput,file:File):Promise<{id:string;path:string;cleanupPending?:boolean}> {
 if(file.size>10*1024*1024) throw new Error('Files must be at most 10 MiB.')
 const client=createAuthBrowserClient()
 const {data,error}=await client.auth.getUser()
 if(error || data.user?.id!==owner) throw new Error('Sign in again to save. Your changes have not been saved.')
 const bucket=input.kind==='bike_photo'?'garage-photos':'garage-receipts'
 const type=input.kind==='bike_photo'?file.type:({'jpg':'image/jpeg','png':'image/png','webp':'image/webp','pdf':'application/pdf'} as Record<string,string>)[input.path.split('.').pop()!]
 const uploaded=await client.storage.from(bucket).upload(input.path,file,{contentType:type,upsert:true})
 if(uploaded.error) throw new Error(uploaded.error.message||'Upload failed. Retry with the same file.')
 const result=await privateFileRequest('POST',input)
 if(!result.id || !result.path) throw new Error('Could not confirm the saved file. Retry with the same file.')
 return {id:result.id,path:result.path,cleanupPending:result.cleanupPending}
}
