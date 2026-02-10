/**
 * Supabase Database Types
 *
 * This file contains TypeScript types for the Supabase database schema.
 *
 * PLACEHOLDER: This file currently exports an empty Database type.
 * Once the Supabase schema is defined, these types should be generated using:
 *
 * ```bash
 * npx supabase gen types typescript --project-id hcpfviemzpdnrhnxrvip > src/types/database.types.ts
 * ```
 *
 * Or via the Supabase CLI:
 * ```bash
 * supabase gen types typescript --linked > src/types/database.types.ts
 * ```
 *
 * The generated types will provide full TypeScript intellisense for:
 * - Table names
 * - Column names and types
 * - Relationships
 * - Views and functions
 *
 * @see https://supabase.com/docs/guides/api/rest/generating-types
 */

// Placeholder Database type
// This will be replaced with auto-generated types once the schema is defined
export type Database = {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// Helper types for working with Supabase queries
// These will be more useful once real tables are defined
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]
