/**
 * Test Database Connection
 *
 * This script tests the connection to Supabase and checks if tables exist.
 * Run with: npx tsx scripts/test-db-connection.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/types/database.types'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

console.log('Supabase URL:', supabaseUrl)
console.log('Service key:', supabaseServiceKey ? 'Set (hidden)' : 'Not set')

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

async function testConnection() {
  console.log('\nTesting database connection...\n')

  // Test motorcycles table
  console.log('Checking motorcycles table...')
  const { data: motorcycles, error: motorcyclesError } = await supabase
    .from('motorcycles')
    .select('id, make, model')
    .limit(5)

  if (motorcyclesError) {
    console.log('  ❌ Error:', motorcyclesError.message)
    console.log('     Table may not exist yet. Run the migration first.')
  } else {
    console.log(`  ✅ Table exists! Found ${motorcycles?.length || 0} motorcycles`)
    if (motorcycles && motorcycles.length > 0) {
      motorcycles.forEach((bike: { id: string; make: string; model: string }) => {
        console.log(`     - ${bike.make} ${bike.model}`)
      })
    }
  }

  // Test diagnostic_trees table
  console.log('\nChecking diagnostic_trees table...')
  const { data: trees, error: treesError } = await supabase
    .from('diagnostic_trees')
    .select('id, title')
    .limit(5)

  if (treesError) {
    console.log('  ❌ Error:', treesError.message)
  } else {
    console.log(`  ✅ Table exists! Found ${trees?.length || 0} diagnostic trees`)
  }

  // Test dtc_codes table
  console.log('\nChecking dtc_codes table...')
  const { data: codes, error: codesError } = await supabase
    .from('dtc_codes')
    .select('id, code')
    .limit(5)

  if (codesError) {
    console.log('  ❌ Error:', codesError.message)
  } else {
    console.log(`  ✅ Table exists! Found ${codes?.length || 0} DTC codes`)
  }

  console.log('\nConnection test completed!')
}

testConnection()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unexpected error:', error)
    process.exit(1)
  })
