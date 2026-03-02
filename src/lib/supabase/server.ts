/**
 * Supabase Client — Server-Side
 *
 * This file provides the Supabase client for use in Server Components,
 * Server Actions, and API routes.
 *
 * Currently uses the anon key for basic operations. When admin operations
 * are needed (bypassing RLS), we'll add a separate service role client.
 *
 * @example Server Component
 * ```tsx
 * import { createServerClient } from '@/lib/supabase/server'
 *
 * export default async function MyPage() {
 *   const supabase = createServerClient()
 *   const { data } = await supabase.from('bikes').select('*')
 *   // ... render data
 * }
 * ```
 *
 * @example API Route
 * ```tsx
 * import { createServerClient } from '@/lib/supabase/server'
 *
 * export async function GET() {
 *   const supabase = createServerClient()
 *   // ... use supabase client
 * }
 * ```
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * Create a Supabase client for server-side use
 *
 * Uses the anon key with RLS policies enforced.
 * For admin operations that bypass RLS, use createServiceClient() (to be added).
 *
 * @returns Supabase client instance configured with anon key
 * @throws Error if environment variables are not set
 */
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Check that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local'
    )
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // Server-side doesn't persist sessions
      autoRefreshToken: false,
    },
  })
}

/**
 * Create a Supabase client with the service role key (bypasses RLS).
 *
 * Only use for trusted server-side operations: RAG ingestion,
 * extraction jobs, and admin tasks. Never expose to the browser.
 *
 * @returns Supabase client instance configured with service role key
 * @throws Error if environment variables are not set
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase environment variables. Check that NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local'
    )
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
