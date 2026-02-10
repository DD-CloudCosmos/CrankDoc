/**
 * Supabase Client — Browser/Client-Side
 *
 * This file provides the Supabase client for use in Client Components
 * (components marked with "use client").
 *
 * Uses the anon key, which is safe to expose in the browser. All security
 * is enforced via Row Level Security (RLS) policies in Supabase.
 *
 * @example
 * ```tsx
 * "use client"
 * import { createClient } from '@/lib/supabase/client'
 *
 * export function MyComponent() {
 *   const supabase = createClient()
 *   // ... use supabase client
 * }
 * ```
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * Create a Supabase client for browser/client-side use
 *
 * @returns Supabase client instance configured with anon key
 * @throws Error if environment variables are not set
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Check that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local'
    )
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
}
