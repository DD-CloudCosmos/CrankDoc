/**
 * Seed Script: Add sample motorcycles to the database
 *
 * This script adds the 5 pilot motorcycles to the database for testing and development.
 * Run with: npx tsx scripts/seed-bikes.ts
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

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

const sampleMotorcycles = [
  {
    make: 'Honda',
    model: 'CBR600RR',
    year_start: 2003,
    year_end: 2024,
    engine_type: 'inline-4',
    displacement_cc: 599,
    category: 'sport',
  },
  {
    make: 'Yamaha',
    model: 'MT-07',
    year_start: 2014,
    year_end: null, // Still in production
    engine_type: 'parallel-twin',
    displacement_cc: 689,
    category: 'naked',
  },
  {
    make: 'Harley-Davidson',
    model: 'Sportster 883',
    year_start: 1986,
    year_end: 2022,
    engine_type: 'V-twin',
    displacement_cc: 883,
    category: 'cruiser',
  },
  {
    make: 'Kawasaki',
    model: 'Ninja 400',
    year_start: 2018,
    year_end: null,
    engine_type: 'parallel-twin',
    displacement_cc: 399,
    category: 'sport',
  },
  {
    make: 'BMW',
    model: 'R1250GS',
    year_start: 2019,
    year_end: null,
    engine_type: 'boxer-twin',
    displacement_cc: 1254,
    category: 'adventure',
  },
]

async function seedMotorcycles() {
  console.log('Starting to seed motorcycles...')

  // Check if motorcycles already exist
  const { data: existing, error: checkError } = await supabase
    .from('motorcycles')
    .select('id, make, model')

  if (checkError) {
    console.error('Error checking existing motorcycles:', checkError)
    process.exit(1)
  }

  if (existing && existing.length > 0) {
    console.log(`Found ${existing.length} existing motorcycles:`)
    existing.forEach((bike: { id: string; make: string; model: string }) => {
      console.log(`  - ${bike.make} ${bike.model}`)
    })
    console.log('\nSkipping seed - database already has motorcycles.')
    console.log('To re-seed, first delete all motorcycles from the database.')
    return
  }

  // Insert sample motorcycles
  const { data, error } = await supabase
    .from('motorcycles')
    .insert(sampleMotorcycles)
    .select()

  if (error) {
    console.error('Error inserting motorcycles:', error)
    process.exit(1)
  }

  console.log(`\nSuccessfully added ${data?.length || 0} motorcycles:`)
  data?.forEach((bike) => {
    const yearRange = bike.year_end ? `${bike.year_start}-${bike.year_end}` : `${bike.year_start}-present`
    console.log(`  - ${bike.make} ${bike.model} (${yearRange})`)
  })

  console.log('\nSeed completed successfully!')
}

seedMotorcycles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unexpected error:', error)
    process.exit(1)
  })
