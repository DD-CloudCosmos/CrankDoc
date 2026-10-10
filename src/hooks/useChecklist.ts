'use client'
import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { guardHistoryDeparture } from '@/lib/historyPositions'
import type { JobView } from '@/lib/maintenance/types'
import { useGarageOwner, useGarageReconciliation } from '@/app/garage/PrivateGarage'
import { checklistDraft } from './checklistDrafts'

export function useChecklist(initial:JobView) {
 const owner=useGarageOwner()
 const draft=useMemo(()=>checklistDraft(owner,initial),[owner,initial])
 const snapshot=useSyncExternalStore(draft.subscribe,draft.getSnapshot,draft.getSnapshot)
 useGarageReconciliation(draft.reconcile)
 useEffect(()=>{draft.watchAuth()},[draft])
 useEffect(()=>{
  if(!snapshot.dirty && !snapshot.saving)return
  const unload=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue=''}
  const leave=(event:MouseEvent)=>{
   const link=(event.target as Element)?.closest('a[href]') as HTMLAnchorElement|null
   if(!link || link.target==='_blank' || link.hasAttribute('download') || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)return
   if(link.href===window.location.href || link.getAttribute('href')?.startsWith('#'))return
   if(!window.confirm('You have unsaved work. Leave this page?')) {event.preventDefault();event.stopPropagation()}
  }
  const stopHistory=guardHistoryDeparture(()=>true)
  const submit=(event:SubmitEvent)=>{
   if(event.defaultPrevented || !(event.target as HTMLFormElement).getAttribute('action'))return
   if(!window.confirm('You have unsaved work. Leave this page?')) {event.preventDefault();event.stopPropagation()}
  }
  document.addEventListener('submit',submit,true)
  window.addEventListener('beforeunload',unload)
  document.addEventListener('click',leave,true)
  return()=>{stopHistory();document.removeEventListener('submit',submit,true);window.removeEventListener('beforeunload',unload);document.removeEventListener('click',leave,true)}
 },[snapshot.dirty,snapshot.saving])
 return {...snapshot,setTask:draft.setTask,retry:draft.retry,reload:draft.reload,complete:draft.complete,correct:draft.correct,setReason:draft.setReason,setCompletion:draft.setCompletion,setDetails:draft.setDetails}
}
