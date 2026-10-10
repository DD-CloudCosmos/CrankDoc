'use client'

import { announceGarageSignOut } from '@/lib/garageSession'
import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signUp, signIn, sendRecovery, setPassword, signOut, type AuthResult } from './actions'

interface AccountFormProps {
  signedIn?: boolean
  resetPassword?: boolean
  invalidLink?: boolean
  next?: string
}

export function AccountForm({ signedIn = false, resetPassword = false, invalidLink = false, next = '/garage' }: AccountFormProps) {
  const [authenticated, setAuthenticated] = useState(signedIn && !invalidLink)
  const [email, setEmail] = useState('')
  const [password, setPasswordValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(invalidLink ? 'This link is invalid or expired. Request a new recovery link below.' : '')
  const [message, setMessage] = useState('')

  async function perform(action: 'sign-in' | 'sign-up' | 'recovery' | 'password' | 'sign-out') {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      let result: AuthResult
      if (action === 'sign-out') result = await signOut()
      else if (action === 'password') result = await setPassword(password)
      else if (action === 'recovery') result = await sendRecovery(email)
      else if (action === 'sign-up') result = await signUp(email, password)
      else result = await signIn(email, password)
      if (!result.ok) { setError(result.message); return }
      if(action==='sign-out')announceGarageSignOut()
      if (action === 'sign-up') setMessage('Check your email to confirm your account, then sign in.')
      else if (action === 'recovery') setMessage('If an account uses this email, a recovery link is on its way. Check your inbox.')
      else if (action === 'password') { setPasswordValue(''); setMessage('Password saved.'); }
      else {
        setEmail('')
        setPasswordValue('')
        setAuthenticated(false)
        // Replace the document so mounted private views and router data are discarded.
        window.location.replace(action === 'sign-out' ? '/account' : next)
      }
    } catch {
      setError('Could not complete this request. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void perform(resetPassword ? 'password' : 'sign-in')
  }

  return (
    <div className="rounded-[20px] bg-card p-5 shadow-card">
      {error && <p id="account-error" role="alert" className="mb-4 text-destructive">{error}</p>}
      {message && <p role="status" className="mb-4">{message}</p>}
      {authenticated && !resetPassword ? (
        <div className="space-y-4">
          <p>You are signed in.</p>
          <Button asChild><Link href="/garage">Open My Garage</Link></Button>
          <Button variant="outline" disabled={busy} onClick={() => void perform('sign-out')}>Sign out</Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" aria-describedby={error ? 'account-error' : undefined}>
          {!resetPassword && <div className="space-y-2">
            <label htmlFor="account-email">Email</label>
            <Input id="account-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>}
          <div className="space-y-2">
            <label htmlFor="account-password">Password</label>
            <Input id="account-password" type="password" autoComplete={resetPassword ? 'new-password' : 'current-password'} minLength={8} required value={password} onChange={(event) => setPasswordValue(event.target.value)} />
            <p className="text-sm text-muted-foreground">Use at least eight characters.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={busy}>{resetPassword ? 'Save password' : 'Sign in'}</Button>
            {!resetPassword && <Button type="button" variant="outline" disabled={busy} onClick={() => {
              if (email && password.length >= 8) void perform('sign-up')
              else setError('Enter your email and a password with at least eight characters.')
            }}>Create account</Button>}
          </div>
          {!resetPassword && <Button type="button" variant="ghost" disabled={busy} onClick={() => {
            if (email) void perform('recovery')
            else setError('Enter your email to request a recovery link.')
          }}>Send recovery link</Button>}
          {resetPassword && <Link href="/account" className="inline-block min-h-11 py-3 text-link">Request a new recovery link</Link>}
        </form>
      )}
    </div>
  )
}
