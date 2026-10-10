'use client'
import {useEffect,useId,useRef,useState} from 'react'
import {createAuthBrowserClient} from '@/lib/supabase/auth-browser'
import {Button} from '@/components/ui/button'
import type {FileInput,PrivateFile} from '@/lib/maintenance/types'
import {privateFileRequest,uploadPrivateFile} from '@/lib/maintenance/uploads'
import {useGarageOwner} from '../PrivateGarage'
const noFiles:PrivateFile[]=[]
type Selected={file:File;input:FileInput;saved:boolean;cleanupPending?:boolean;error:string}
export function ReceiptUpload({bikeId,jobId,onChanged,files=noFiles,disabled=false}:{bikeId:string;jobId:string;onChanged:()=>void;files?:PrivateFile[];disabled?:boolean}) {
 const linkGeneration=useRef(0);const revoked=useRef(false)
 const owner=useGarageOwner();const inputId=useId();const [selected,setSelected]=useState<Selected[]>([]);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [removing,setRemoving]=useState<string|null>(null);const pending=useRef(false)
 useEffect(()=>{
  revoked.current=false
  const revoke=()=>{revoked.current=true;linkGeneration.current++}
  const {data:{subscription}}=createAuthBrowserClient().auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT' || (session && session.user.id!==owner))revoke()})
  return ()=>{revoke();subscription.unsubscribe()}
 },[owner])
 function choose(files:FileList|null) {
  const next:Selected[]=Array.from(files??[]).map(file=>{
   const extension=({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf'} as Record<string,string>)[file.type]
   const id=crypto.randomUUID()
   return {file,saved:false,error:!extension?'Choose JPEG, PNG, WebP or PDF.':file.size>10*1024*1024?'Files must be at most 10 MiB.':'',input:{id,kind:'receipt',bikeId,jobId,path:`${owner}/jobs/${jobId}/${id}.${extension}.source`,filename:file.name}}
  })
  setSelected(next);setError('')
 }
 async function save() {
  if(pending.current || disabled) return
  pending.current=true;setBusy(true)
  const next=[...selected]
  try {
   for(let i=0;i<next.length;i++) {
    const item=next[i];if(item.saved) continue
    try {const result=await uploadPrivateFile(owner,item.input,item.file);next[i]={...item,saved:true,cleanupPending:result.cleanupPending,error:''};onChanged()}
    catch(error) {next[i]={...item,error:error instanceof Error?error.message:'Upload failed. Retry.'}}
    setSelected([...next])
   }
  } finally {pending.current=false;setBusy(false)}
 }
 async function download(file:PrivateFile) {
  if(revoked.current) return
  const current=++linkGeneration.current
  setError('')
  try {
   const result=await privateFileRequest('GET',file.id)
   if(revoked.current || current!==linkGeneration.current) return
   if(!result.url) throw new Error('Download unavailable. Retry.')
   // Never inject receipt content. The signed URL sets attachment disposition.
   const link=document.createElement('a');link.href=result.url;link.download='';link.rel='noopener';link.click();link.removeAttribute('href')
  } catch(error) {setError(error instanceof Error?error.message:'Download unavailable. Retry.')}
 }
 async function cleanupSource(file:PrivateFile) {
  if(pending.current || disabled) return
  pending.current=true;setBusy(true);setError('')
  try {await privateFileRequest('POST',{fileId:file.id,cleanupSource:true});onChanged()}
  catch(error) {setError(error instanceof Error?error.message:'Source cleanup failed. Retry.');onChanged()}
  finally {pending.current=false;setBusy(false)}
 }
 async function remove(file:PrivateFile) {
  if(pending.current || disabled) return
  pending.current=true;setBusy(true);setError('')
  try {await privateFileRequest('DELETE',{fileId:file.id});setRemoving(null);onChanged()}
  catch(error) {setError(error instanceof Error?error.message:'File cleanup failed. Retry removal.');onChanged()}
  finally {pending.current=false;setBusy(false)}
 }
 return <div className="space-y-3 border-t border-separator p-4"><label htmlFor={inputId} className="block">Optional receipts</label><input id={inputId} type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" className="min-h-11 w-full min-w-0" disabled={busy || disabled} onChange={event=>choose(event.target.files)} /><p className="text-sm text-muted-foreground">JPEG, PNG, WebP or PDF. At most 10 MiB each, ten receipts per job.</p>{selected.map(item=><p key={item.input.id} role={item.error?'alert':'status'} className="break-words">{item.file.name}: {item.saved?(item.cleanupPending?'Saved. Source cleanup needs retry.':'Saved'):item.error||'Ready to save'}</p>)}{selected.some(item=>!item.saved) && <Button className="min-h-11" disabled={busy || disabled} onClick={()=>void save()}>{selected.some(item=>item.error)?'Retry receipts':'Save receipts'}</Button>}{files.map(file=><div key={file.id} className="space-y-2 break-words"><p>{file.filename}</p>{file.sourcePending && !file.cleanupPending && <p role="status">Receipt saved. Source cleanup needs retry.</p>}<div className="flex flex-wrap gap-3">{!file.cleanupPending && <Button variant="outline" className="min-h-11" onClick={()=>void download(file)} aria-label={`Download ${file.filename}`}>Download</Button>}<Button variant="outline" className="min-h-11" disabled={busy || disabled} onClick={()=>setRemoving(file.id)}>{file.cleanupPending?'Retry receipt removal':'Remove receipt'}</Button>{file.sourcePending && !file.cleanupPending && <Button variant="outline" className="min-h-11" disabled={busy || disabled} aria-label="Retry receipt source cleanup" onClick={()=>void cleanupSource(file)}>Retry cleanup</Button>}</div>{removing===file.id && <div className="flex flex-wrap gap-3"><p className="w-full">Remove this receipt?</p><Button className="min-h-11" disabled={busy || disabled} onClick={()=>void remove(file)}>Confirm receipt removal</Button><Button variant="outline" className="min-h-11" disabled={busy} onClick={()=>setRemoving(null)}>Cancel receipt removal</Button></div>}</div>)}{error && <p role="alert">{error}</p>}</div>
}
