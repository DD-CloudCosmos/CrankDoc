/**
 * Supabase Client Exports
 *
 * Re-exports Supabase clients for convenient importing throughout the app.
 *
 * @example Client Component
 * ```tsx
 * import { createClient } from '@/lib/supabase'
 * ```
 *
 * @example Server Component
 * ```tsx
 * import { createServerClient } from '@/lib/supabase'
 * ```
 *
 * @example Admin / Service Role (server-side only)
 * ```tsx
 * import { createServiceClient } from '@/lib/supabase'
 * ```
 */

export { createClient } from './client'
export { createServerClient, createServiceClient } from './server'
