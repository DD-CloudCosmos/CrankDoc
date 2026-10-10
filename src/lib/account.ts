import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { createAuthServerClient } from '@/lib/supabase/auth-server'

export type AccountContext = { client: SupabaseClient<Database>; userId: string }

export function safeReturnPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\x00-\x1f\x7f]/.test(value)) return '/garage'
  try {
    if (/[\\\x00-\x1f\x7f]/.test(decodeURIComponent(value))) return '/garage'
    const url = new URL(value, 'https://local.invalid')
    if (url.origin !== 'https://local.invalid') return '/garage'
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return '/garage'
  }
}

export async function getAccount(): Promise<AccountContext | null> {
  const client = await createAuthServerClient()
  const { data, error } = await client.auth.getUser()
  return error || !data.user ? null : { client, userId: data.user.id }
}
