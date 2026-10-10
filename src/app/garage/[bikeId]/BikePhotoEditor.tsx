'use client'
import {useEffect,useRef,useState,useId,useCallback} from 'react'
import {Button} from '@/components/ui/button'
import {BikeThumb} from '@/components/BikeThumb'
import type {BikeView} from '@/lib/garageBikes'
import type {FileInput,PrivateFile} from '@/lib/maintenance/types'
import {privateFileRequest,uploadPrivateFile} from '@/lib/maintenance/uploads'
import {createAuthBrowserClient} from '@/lib/supabase/auth-browser'
import {useGarageOwner,useGarageReconciliation} from '../PrivateGarage'
import {onGarageSignOut} from '@/lib/garageSession'

/** Private photos use a plain image, bypassing the shared Next image cache. */
export function PrivateBikePhoto({bike,className}:{bike:BikeView;className?:string}) {
 const owner=useGarageOwner()
 const [signed,setSigned]=useState<{path:string;url:string}|null>(null)
 const [error,setError]=useState('')
 const retry=useRef<()=>Promise<void>>(async()=>{})
 const renew=useRef<()=>Promise<void>>(async()=>{})
 useGarageReconciliation(useCallback(async()=>{await renew.current()},[]))
 useEffect(()=>{
  if(!bike.photoPath) return
  const path=bike.photoPath
  const fileId=path.split('/').pop()!.replace(/\.webp$/,'')
  let active=true;let revoked=false;let suspended=false;let timer:ReturnType<typeof setTimeout>|undefined;let generation=0;let expiresAt=0
  async function refresh() {
   if(!active || revoked || suspended)return
   clearTimeout(timer)
   const current=++generation
   if(Date.now()>=expiresAt)setSigned(null)
   try {
    const result=await privateFileRequest('GET',fileId)
    if(!result.url)throw new Error('Missing photo URL')
    if(active && !revoked && !suspended && current===generation) {expiresAt=Date.now()+(result.expiresIn??60)*1000;setSigned({path,url:result.url});setError('');timer=setTimeout(()=>void refresh(),(result.expiresIn??60)*1000)}
   } catch {if(active && !revoked && !suspended && current===generation) {setError('Photo unavailable. Retry loading the image.');timer=setTimeout(()=>void refresh(),expiresAt>Date.now()?Math.min(15000,expiresAt-Date.now()):15000)}}
  }
  const suspend=()=>{suspended=true;generation++;clearTimeout(timer);setSigned(null);setError('')}
  const revoke=()=>{revoked=true;suspend()}
  retry.current=refresh
  renew.current=async()=>{if(!revoked && active){suspended=false;await refresh()}}
  void refresh()
  const {data:{subscription}}=createAuthBrowserClient().auth.onAuthStateChange((event,session)=>{
   if(session && session.user.id!==owner)revoke()
   else if(event==='SIGNED_OUT')suspend()
  })
  const stopLogout=onGarageSignOut(revoke)
  return ()=>{active=false;revoke();subscription.unsubscribe();stopLogout();renew.current=async()=>{}}

 },[bike.photoPath,owner])
 return <div><BikeThumb imageUrl={bike.photoPath?(signed?.path===bike.photoPath?signed.url:null):bike.libraryImageUrl} alt={`${bike.make} ${bike.model}`} className={className} />{bike.photoPath && error && <p role="status">{error}<Button variant="outline" type="button" onClick={()=>void retry.current()}>Retry photo</Button></p>}</div>
}
export function BikePhotoEditor({bike,files=[],onChanged,disabled=false}:{bike:BikeView;files?:PrivateFile[];onChanged:()=>void;disabled?:boolean}) {
 const owner=useGarageOwner();const inputId=useId()
 const [editing,setEditing]=useState(false);const [selection,setSelection]=useState<{file:File;input:FileInput;preview:string}|null>(null)
 const [confirm,setConfirm]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [cleanup,setCleanup]=useState(false)
 const needsCleanup=cleanup || files.some(file=>file.kind==='bike_photo' && (file.cleanupPending || file.sourcePending))
 const pending=useRef(false)
 useEffect(()=>()=>{if(selection) URL.revokeObjectURL(selection.preview)},[selection])
 function select(file:File|undefined) {
  setError('');if(!file) {setSelection(null);return}
  if(file.size>10*1024*1024 || !['image/jpeg','image/png','image/webp'].includes(file.type)) {setError('Choose a JPEG, PNG or WebP image, at most 10 MiB.');return}
  const id=crypto.randomUUID()
  setSelection({file,preview:URL.createObjectURL(file),input:{id,kind:'bike_photo',bikeId:bike.id,jobId:null,path:`${owner}/bikes/${bike.id}/${id}.source`,filename:file.name}})
 }
 async function save() {
  if(!selection || pending.current || disabled) return
  pending.current=true;setBusy(true);setError('')
  try {
   const result=await uploadPrivateFile(owner,selection.input,selection.file)
   setCleanup(Boolean(result.cleanupPending));setSelection(null);setEditing(false);onChanged()
  } catch(error) {setError(error instanceof Error?error.message:'Could not save the image. The previous image is kept.')}
  finally {pending.current=false;setBusy(false)}
 }
 async function restore() {
  if(pending.current || disabled) return
  pending.current=true;setBusy(true);setError('')
  try {await privateFileRequest('DELETE',{bikeId:bike.id,restoreDefault:true,confirmed:true});setConfirm(false);setCleanup(false);onChanged()}
  catch(error) {setError(error instanceof Error?error.message:'Could not restore the library image. Retry.');onChanged()}
  finally {pending.current=false;setBusy(false)}
 }
 async function retryCleanup() {
  if(!needsCleanup || pending.current) return
  pending.current=true;setBusy(true);setError('')
  try {const result=await privateFileRequest('POST',{bikeId:bike.id,cleanup:true});if(!result.cleanupPending)setCleanup(false);onChanged()}
  catch(error) {setError(error instanceof Error?error.message:'Cleanup needs another retry.')}
  finally {pending.current=false;setBusy(false)}
 }
 return <div className="space-y-3"><div className="flex flex-wrap gap-3"><Button variant="ghost" className="min-h-11" disabled={busy || disabled} onClick={()=>{setEditing(true);setError('')}}>Edit image</Button>{bike.photoPath && <Button variant="ghost" className="min-h-11" disabled={busy || disabled} onClick={()=>setConfirm(true)}>Restore library image</Button>}</div>{editing && <div className="space-y-3"><label className="block" htmlFor={inputId}>Choose bike photo</label><input id={inputId} type="file" accept="image/jpeg,image/png,image/webp" className="min-h-11 w-full min-w-0" disabled={busy || disabled} onChange={event=>select(event.target.files?.[0])} /><p className="text-sm text-muted-foreground">JPEG, PNG or WebP. At most 10 MiB and 40 million pixels.</p>{selection && <BikeThumb imageUrl={selection.preview} alt="Photo preview" className="h-52 w-full rounded-[14px]" />}<div className="flex flex-wrap gap-3"><Button className="min-h-11" disabled={!selection || busy || disabled} onClick={()=>void save()}>Save image</Button><Button variant="outline" className="min-h-11" disabled={busy} onClick={()=>{setSelection(null);setEditing(false);setError('')}}>Cancel image edit</Button></div></div>}{confirm && <div role="group" aria-label="Confirm image restoration" className="space-y-3"><p>Remove this bike’s personal image and use its current library image?</p><div className="flex flex-wrap gap-3"><Button className="min-h-11" disabled={busy || disabled} onClick={()=>void restore()}>Confirm library image</Button><Button variant="outline" className="min-h-11" disabled={busy} onClick={()=>setConfirm(false)}>Cancel restoration</Button></div></div>}{needsCleanup && <p role="status">Image file cleanup needs retry.<Button variant="outline" className="min-h-11" disabled={busy} onClick={()=>void retryCleanup()}>Retry image cleanup</Button></p>}{error && <p role="alert">{error}</p>}</div>
}
