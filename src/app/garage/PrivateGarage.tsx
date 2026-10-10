'use client'

import { createContext, useContext, useEffect, useState, useRef, useCallback, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import Link from 'next/link'
import { onGarageSignOut } from '@/lib/garageSession'
import { clearChecklistDrafts } from '@/hooks/checklistDrafts'
import { createAuthBrowserClient } from '@/lib/supabase/auth-browser'

const Owner = createContext('')
export function useGarageOwner() { return useContext(Owner) }

type Reconcile = () => Promise<void>
const Reconciliations = createContext<(callback: Reconcile) => () => void>(() => () => {})
export function useGarageReconciliation(callback: Reconcile) {
  const register = useContext(Reconciliations)
  useEffect(() => register(callback), [register, callback])
}

/** Verify the document's owner before showing private children, including restored pages. */
export function PrivateGarage({ ownerId, children }: { ownerId: string; children: ReactNode }) {
  const reconciliations = useRef(new Set<Reconcile>())
  const register = useCallback((callback: Reconcile) => {
    reconciliations.current.add(callback)
    return () => { reconciliations.current.delete(callback) }
  }, [])
  const [allowed, setAllowed] = useState(false)
  const [invalidated, setInvalidated] = useState(false)
  const [expired, setExpired] = useState(false)
  useEffect(() => {
    const client = createAuthBrowserClient()
    let active = true
    let generation = 0
    let revoked = false
    const revoke = () => {
      revoked = true
      clearChecklistDrafts(ownerId)
      generation++
      setAllowed(false)
      setInvalidated(true)
    }
    const check = async () => {
      const current = ++generation
      setAllowed(false)
      try {
        const { data, error } = await client.auth.getUser()
        if (!active || current !== generation || revoked) return
        if (data.user && data.user.id !== ownerId) revoke()
        else if (error || !data.user) { setAllowed(false); setExpired(true) }
        else {
          await Promise.all([...reconciliations.current].map(reconcile => reconcile()))
          if (active && current === generation && !revoked) setAllowed(true)
        }
      } catch {
        if (active && current === generation && !revoked) setExpired(true)
      }
    }
    void check()
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if(session && session.user.id!==ownerId)revoke()
      else if(event==='SIGNED_OUT') {generation++;setAllowed(false);setExpired(true)}
    })
    const stopLogout=onGarageSignOut(revoke)
    const hide = () => { generation++; flushSync(() => setAllowed(false)) }
    const resume = () => { void check() }
    const restore = () => { hide(); resume() }
    const visibility = () => { if (document.visibilityState === 'visible') resume(); else hide() }
    window.addEventListener('pagehide', hide)
    window.addEventListener('pageshow', resume)
    window.addEventListener('popstate', restore)
    window.addEventListener('focus', resume)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      active = false
      subscription.unsubscribe()
      stopLogout()
      window.removeEventListener('pagehide', hide)
      window.removeEventListener('pageshow', resume)
      window.removeEventListener('popstate', restore)
      window.removeEventListener('focus', resume)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [ownerId])
  return <Owner.Provider value={ownerId}><Reconciliations.Provider value={register}>{!allowed && <p role="status">{invalidated || expired ? <><a href="/account?next=/garage" target={expired && !invalidated ? '_blank' : undefined} className="text-link">Sign in to open My Garage</a>{expired && !invalidated && <span className="block text-muted-foreground">Your unsaved work stays in this tab. Sign in in the new tab, then return here.</span>}</> : 'Checking your account…'}</p>}<div hidden={!allowed}>{!invalidated && children}<Link href="/account" prefetch={false} className="mt-6 inline-block min-h-11 py-3 text-link">Your account</Link></div></Reconciliations.Provider></Owner.Provider>
}
