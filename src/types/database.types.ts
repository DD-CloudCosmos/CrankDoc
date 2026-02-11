/**
 * Supabase Database Types
 *
 * This file contains TypeScript types for the Supabase database schema.
 * These types are manually created based on the schema in:
 * supabase/migrations/001_initial_schema.sql
 *
 * To regenerate from live database (after schema changes):
 * ```bash
 * npx supabase gen types typescript --project-id hcpfviemzpdnrhnxrvip > src/types/database.types.ts
 * ```
 *
 * @see https://supabase.com/docs/guides/api/rest/generating-types
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      motorcycles: {
        Row: {
          id: string
          make: string
          model: string
          year_start: number
          year_end: number | null
          engine_type: string | null
          displacement_cc: number | null
          category: string | null
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          make: string
          model: string
          year_start: number
          year_end?: number | null
          engine_type?: string | null
          displacement_cc?: number | null
          category?: string | null
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          make?: string
          model?: string
          year_start?: number
          year_end?: number | null
          engine_type?: string | null
          displacement_cc?: number | null
          category?: string | null
          image_url?: string | null
          created_at?: string
        }
      }
      diagnostic_trees: {
        Row: {
          id: string
          motorcycle_id: string | null
          title: string
          description: string | null
          category: string | null
          difficulty: 'beginner' | 'intermediate' | 'advanced' | null
          tree_data: Json
          created_at: string
        }
        Insert: {
          id?: string
          motorcycle_id?: string | null
          title: string
          description?: string | null
          category?: string | null
          difficulty?: 'beginner' | 'intermediate' | 'advanced' | null
          tree_data: Json
          created_at?: string
        }
        Update: {
          id?: string
          motorcycle_id?: string | null
          title?: string
          description?: string | null
          category?: string | null
          difficulty?: 'beginner' | 'intermediate' | 'advanced' | null
          tree_data?: Json
          created_at?: string
        }
      }
      dtc_codes: {
        Row: {
          id: string
          code: string
          description: string
          category: string | null
          common_causes: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          description: string
          category?: string | null
          common_causes?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          description?: string
          category?: string | null
          common_causes?: string[] | null
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// Helper types for working with Supabase queries
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]

// Convenience types for each table
export type Motorcycle = Tables<'motorcycles'>
export type DiagnosticTree = Tables<'diagnostic_trees'>
export type DtcCode = Tables<'dtc_codes'>

// Decision tree node types (for tree_data JSONB structure)
export interface DecisionTreeNode {
  id: string
  type: 'question' | 'check' | 'solution'
  text: string
  safety: 'green' | 'yellow' | 'red'
  warning?: string
  instructions?: string
  options?: Array<{
    text: string
    next: string
  }>
  next?: string
  action?: string
  details?: string
}

export interface DecisionTreeData {
  nodes: DecisionTreeNode[]
}

// VIN decoder types (NHTSA vPIC API response)
export interface VinDecodedResult {
  make: string | null
  model: string | null
  year: number | null
  vehicleType: string | null
  engineSize: string | null
  fuelType: string | null
  displacement: string | null
  cylinders: string | null
  transmissionType: string | null
  errorCode: string | null
  errorText: string | null
}
