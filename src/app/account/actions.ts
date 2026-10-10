'use server'

import { createAuthServerClient } from '@/lib/supabase/auth-server'
import { getAccount } from '@/lib/account'

export type AuthResult = { ok: true } | { ok: false; message: string }

export async function signUp(email: string, password: string): Promise<AuthResult> {
  if (password.length < 8) return { ok: false, message: 'Use a password with at least eight characters.' }
  const client = await createAuthServerClient()
  const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL!).origin
  const { error } = await client.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${origin}/auth/callback?next=/garage` } })
  return error ? { ok: false, message: 'Could not create your account. Please try again.' } : { ok: true }
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const client = await createAuthServerClient()
  const { error } = await client.auth.signInWithPassword({ email: email.trim(), password })
  return error ? { ok: false, message: 'Could not sign in. Check your email and password, and confirm your email first.' } : { ok: true }
}

export async function sendRecovery(email: string): Promise<AuthResult> {
  const client = await createAuthServerClient()
  const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL!).origin
  const { error } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${origin}/auth/callback?next=/account/reset-password` })
  return error ? { ok: false, message: 'Could not send a recovery link. Please try again.' } : { ok: true }
}

export async function setPassword(password: string): Promise<AuthResult> {
  if (password.length < 8) return { ok: false, message: 'Use a password with at least eight characters.' }
  const account = await getAccount()
  if (!account) return { ok: false, message: 'Your session expired. Request a new recovery link and try again.' }
  const { error } = await account.client.auth.updateUser({ password })
  return error ? { ok: false, message: 'Could not save your password. Please try again or request a new recovery link.' } : { ok: true }
}

export async function signOut(): Promise<AuthResult> {
  const client = await createAuthServerClient()
  const { error } = await client.auth.signOut({ scope: 'local' })
  return error ? { ok: false, message: 'Could not sign out. Please try again.' } : { ok: true }
}
