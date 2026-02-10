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
 * TODO: Add createServiceClient() when admin operations are needed
 *
 * This will use SUPABASE_SERVICE_ROLE_KEY and bypass RLS policies.
 * Only use for trusted server-side operations (never expose to browser).
 *
 * @example
 * ```tsx
 * // Future implementation
 * export function createServiceClient() {
 *   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
 *   const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
 *   return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey)
 * }
 * ```
 */
