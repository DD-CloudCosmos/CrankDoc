/**
 * Supabase Database Types
 *
 * This file contains TypeScript types for the Supabase database schema.
 * These types are manually created based on the schema in:
 * supabase/migrations/001_initial_schema.sql
 * supabase/migrations/002_phase5_schema.sql
 * supabase/migrations/004_recalls_schema.sql
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
          generation: string | null
          fuel_system: string | null
          dry_weight_kg: number | null
          horsepower: number | null
          torque_nm: number | null
          fuel_capacity_liters: number | null
          oil_capacity_liters: number | null
          coolant_capacity_liters: number | null
          valve_clearance_intake: string | null
          valve_clearance_exhaust: string | null
          spark_plug: string | null
          tire_front: string | null
          tire_rear: string | null
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
          generation?: string | null
          fuel_system?: string | null
          dry_weight_kg?: number | null
          horsepower?: number | null
          torque_nm?: number | null
          fuel_capacity_liters?: number | null
          oil_capacity_liters?: number | null
          coolant_capacity_liters?: number | null
          valve_clearance_intake?: string | null
          valve_clearance_exhaust?: string | null
          spark_plug?: string | null
          tire_front?: string | null
          tire_rear?: string | null
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
          generation?: string | null
          fuel_system?: string | null
          dry_weight_kg?: number | null
          horsepower?: number | null
          torque_nm?: number | null
          fuel_capacity_liters?: number | null
          oil_capacity_liters?: number | null
          coolant_capacity_liters?: number | null
          valve_clearance_intake?: string | null
          valve_clearance_exhaust?: string | null
          spark_plug?: string | null
          tire_front?: string | null
          tire_rear?: string | null
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
          subcategory: string | null
          severity: 'low' | 'medium' | 'high' | 'critical' | null
          common_causes: string[] | null
          applies_to_makes: string[] | null
          manufacturer: string | null
          system: string | null
          diagnostic_method: string | null
          fix_reference: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          description: string
          category?: string | null
          subcategory?: string | null
          severity?: 'low' | 'medium' | 'high' | 'critical' | null
          common_causes?: string[] | null
          applies_to_makes?: string[] | null
          manufacturer?: string | null
          system?: string | null
          diagnostic_method?: string | null
          fix_reference?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          description?: string
          category?: string | null
          subcategory?: string | null
          severity?: 'low' | 'medium' | 'high' | 'critical' | null
          common_causes?: string[] | null
          applies_to_makes?: string[] | null
          manufacturer?: string | null
          system?: string | null
          diagnostic_method?: string | null
          fix_reference?: string | null
          created_at?: string
        }
      }
      service_intervals: {
        Row: {
          id: string
          motorcycle_id: string
          service_name: string
          interval_miles: number | null
          interval_km: number | null
          interval_months: number | null
          description: string | null
          torque_spec: string | null
          fluid_spec: string | null
          created_at: string
        }
        Insert: {
          id?: string
          motorcycle_id: string
          service_name: string
          interval_miles?: number | null
          interval_km?: number | null
          interval_months?: number | null
          description?: string | null
          torque_spec?: string | null
          fluid_spec?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          motorcycle_id?: string
          service_name?: string
          interval_miles?: number | null
          interval_km?: number | null
          interval_months?: number | null
          description?: string | null
          torque_spec?: string | null
          fluid_spec?: string | null
          created_at?: string
        }
      }
      technical_documents: {
        Row: {
          id: string
          motorcycle_id: string | null
          title: string
          doc_type: string
          description: string | null
          file_url: string
          file_type: string
          source_attribution: string | null
          created_at: string
        }
        Insert: {
          id?: string
          motorcycle_id?: string | null
          title: string
          doc_type: string
          description?: string | null
          file_url: string
          file_type: string
          source_attribution?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          motorcycle_id?: string | null
          title?: string
          doc_type?: string
          description?: string | null
          file_url?: string
          file_type?: string
          source_attribution?: string | null
          created_at?: string
        }
      }
      recalls: {
        Row: {
          id: string
          nhtsa_campaign_number: string
          data_source: string
          manufacturer: string
          make: string
          model: string
          model_year: number
          component: string | null
          summary: string | null
          consequence: string | null
          remedy: string | null
          notes: string | null
          report_received_date: string | null
          park_it: boolean
          park_outside: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nhtsa_campaign_number: string
          data_source?: string
          manufacturer: string
          make: string
          model: string
          model_year: number
          component?: string | null
          summary?: string | null
          consequence?: string | null
          remedy?: string | null
          notes?: string | null
          report_received_date?: string | null
          park_it?: boolean
          park_outside?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nhtsa_campaign_number?: string
          data_source?: string
          manufacturer?: string
          make?: string
          model?: string
          model_year?: number
          component?: string | null
          summary?: string | null
          consequence?: string | null
          remedy?: string | null
          notes?: string | null
          report_received_date?: string | null
          park_it?: boolean
          park_outside?: boolean
          created_at?: string
        }
      }
      motorcycle_images: {
        Row: {
          id: string
          motorcycle_id: string
          image_url: string
          alt_text: string
          is_primary: boolean
          source_attribution: string | null
          created_at: string
        }
        Insert: {
          id?: string
          motorcycle_id: string
          image_url: string
          alt_text: string
          is_primary?: boolean
          source_attribution?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          motorcycle_id?: string
          image_url?: string
          alt_text?: string
          is_primary?: boolean
          source_attribution?: string | null
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
export type ServiceInterval = Tables<'service_intervals'>
export type TechnicalDocument = Tables<'technical_documents'>
export type Recall = Tables<'recalls'>
export type MotorcycleImage = Tables<'motorcycle_images'>

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
