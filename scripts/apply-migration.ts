/**
 * Apply Database Migration
 *
 * This script applies the initial schema migration to the Supabase database.
 * Run with: npx tsx scripts/apply-migration.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('Reading migration file...')

  const migrationPath = resolve(process.cwd(), 'supabase/migrations/001_initial_schema.sql')
  const migrationSQL = readFileSync(migrationPath, 'utf-8')

  console.log('Applying migration to database...')

  // Split the SQL by semicolons and execute each statement
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  for (const statement of statements) {
    try {
      console.log(`Executing: ${statement.substring(0, 50)}...`)
      const { error } = await supabase.rpc('exec_sql', { sql: statement })

      if (error) {
        console.error('Error executing statement:', error)
        console.log('Statement was:', statement)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
    }
  }

  console.log('\nMigration completed!')
  console.log('Note: If there were errors, the tables may already exist.')
}

applyMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unexpected error:', error)
    process.exit(1)
  })
