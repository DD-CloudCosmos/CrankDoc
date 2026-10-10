'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import Link from 'next/link'
import { createAuthBrowserClient } from '@/lib/supabase/auth-browser'

const Owner = createContext('')
export function useGarageOwner() { return useContext(Owner) }

/** Verify the document's owner before showing private children, including restored pages. */
export function PrivateGarage({ ownerId, children }: { ownerId: string; children: ReactNode }) {
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
        else setAllowed(true)
      } catch {
        if (active && current === generation && !revoked) setExpired(true)
      }
    }
    void check()
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || (session && session.user.id !== ownerId)) revoke()
    })
    const hide = () => { generation++; flushSync(() => setAllowed(false)) }
    const resume = () => { void check() }
    const visibility = () => { if (document.visibilityState === 'visible') resume(); else hide() }
    window.addEventListener('pagehide', hide)
    window.addEventListener('pageshow', resume)
    window.addEventListener('focus', resume)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      active = false
      subscription.unsubscribe()
      window.removeEventListener('pagehide', hide)
      window.removeEventListener('pageshow', resume)
      window.removeEventListener('focus', resume)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [ownerId])
  return <Owner.Provider value={ownerId}>{!allowed && <p role="status">{invalidated || expired ? <><a href="/account?next=/garage" target={expired && !invalidated ? '_blank' : undefined} className="text-link">Sign in to open My Garage</a>{expired && !invalidated && <span className="block text-muted-foreground">Your unsaved work stays in this tab. Sign in in the new tab, then return here.</span>}</> : 'Checking your account…'}</p>}<div hidden={!allowed}>{!invalidated && children}<Link href="/account" prefetch={false} className="mt-6 inline-block min-h-11 py-3 text-link">Your account</Link></div></Owner.Provider>
}
