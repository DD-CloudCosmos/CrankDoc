#!/usr/bin/env node

/**
 * CrankDoc Reseed Script
 *
 * Clears existing data and inserts generation-split motorcycles.
 * Run this AFTER applying 002_phase5_schema.sql migration.
 *
 * Usage: node scripts/reseed-motorcycles.js
 */

const path = require('path')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const motorcycles = [
  {
    make: 'Honda', model: 'CBR600RR', year_start: 2003, year_end: 2004,
    engine_type: 'inline-4', displacement_cc: 599, category: 'sport',
    generation: 'Gen 1 (2003-2004)', fuel_system: 'EFI (PGM-FI)',
    dry_weight_kg: 170, horsepower: 117, torque_nm: 66,
    fuel_capacity_liters: 18, oil_capacity_liters: 3.4,
    valve_clearance_intake: '0.16-0.19mm', valve_clearance_exhaust: '0.22-0.27mm',
    spark_plug: 'NGK IMR9C-9HES', tire_front: '120/70ZR17', tire_rear: '180/55ZR17'
  },
  {
    make: 'Honda', model: 'CBR600RR', year_start: 2005, year_end: 2006,
    engine_type: 'inline-4', displacement_cc: 599, category: 'sport',
    generation: 'Gen 2 (2005-2006)', fuel_system: 'EFI (PGM-FI, dual-stage)',
    dry_weight_kg: 155, horsepower: 118, torque_nm: 66,
    fuel_capacity_liters: 18, oil_capacity_liters: 3.4,
    valve_clearance_intake: '0.16-0.19mm', valve_clearance_exhaust: '0.22-0.27mm',
    spark_plug: 'NGK IMR9C-9HES', tire_front: '120/70ZR17', tire_rear: '180/55ZR17'
  },
  {
    make: 'Honda', model: 'CBR600RR', year_start: 2007, year_end: 2012,
    engine_type: 'inline-4', displacement_cc: 599, category: 'sport',
    generation: 'Gen 3 (2007-2012)', fuel_system: 'EFI (PGM-FI)',
    dry_weight_kg: 156, horsepower: 118, torque_nm: 66,
    fuel_capacity_liters: 18.1, oil_capacity_liters: 3.4,
    valve_clearance_intake: '0.16-0.19mm', valve_clearance_exhaust: '0.22-0.27mm',
    spark_plug: 'NGK IMR9C-9HES', tire_front: '120/70ZR17', tire_rear: '180/55ZR17'
  },
  {
    make: 'Honda', model: 'CBR600RR', year_start: 2013, year_end: 2024,
    engine_type: 'inline-4', displacement_cc: 599, category: 'sport',
    generation: 'Gen 4 (2013-2024)', fuel_system: 'EFI (PGM-FI)',
    dry_weight_kg: 162, horsepower: 118, torque_nm: 66,
    fuel_capacity_liters: 18.1, oil_capacity_liters: 3.4,
    valve_clearance_intake: '0.16-0.19mm', valve_clearance_exhaust: '0.22-0.27mm',
    spark_plug: 'NGK IMR9C-9HES', tire_front: '120/70ZR17', tire_rear: '180/55ZR17'
  },
  {
    make: 'Yamaha', model: 'MT-07', year_start: 2014, year_end: null,
    engine_type: 'parallel-twin', displacement_cc: 689, category: 'naked',
    fuel_system: 'EFI', dry_weight_kg: 182, horsepower: 73, torque_nm: 67,
    fuel_capacity_liters: 14, oil_capacity_liters: 1.7,
    valve_clearance_intake: '0.11-0.20mm', valve_clearance_exhaust: '0.21-0.30mm',
    spark_plug: 'NGK LMAR8A-9', tire_front: '120/70ZR17', tire_rear: '180/55ZR17'
  },
  {
    make: 'Harley-Davidson', model: 'Sportster 883', year_start: 1986, year_end: 2006,
    engine_type: 'v-twin', displacement_cc: 883, category: 'cruiser',
    generation: 'Carbureted (1986-2006)', fuel_system: 'Keihin CV40 carburetor',
    dry_weight_kg: 227, horsepower: 53, torque_nm: 69,
    fuel_capacity_liters: 12.5, oil_capacity_liters: 2.8,
    valve_clearance_intake: '0.001-0.003in', valve_clearance_exhaust: '0.002-0.004in',
    spark_plug: 'Harley 6R12', tire_front: 'MH90-21', tire_rear: '150/80-16'
  },
  {
    make: 'Harley-Davidson', model: 'Sportster 883', year_start: 2007, year_end: 2022,
    engine_type: 'v-twin', displacement_cc: 883, category: 'cruiser',
    generation: 'EFI (2007-2022)', fuel_system: 'Electronic Sequential Port Fuel Injection',
    dry_weight_kg: 256, horsepower: 53, torque_nm: 69,
    fuel_capacity_liters: 12.5, oil_capacity_liters: 2.8,
    valve_clearance_intake: '0.001-0.003in', valve_clearance_exhaust: '0.002-0.004in',
    spark_plug: 'Harley 6R12', tire_front: 'MH90-21', tire_rear: '150/80-16'
  },
  {
    make: 'Harley-Davidson', model: 'Sportster 1200', year_start: 1988, year_end: 2006,
    engine_type: 'v-twin', displacement_cc: 1202, category: 'cruiser',
    generation: 'Carbureted (1988-2006)', fuel_system: 'Keihin CV40 carburetor',
    dry_weight_kg: 230, horsepower: 67, torque_nm: 84,
    fuel_capacity_liters: 12.5, oil_capacity_liters: 2.8,
    valve_clearance_intake: '0.001-0.003in', valve_clearance_exhaust: '0.002-0.004in',
    spark_plug: 'Harley 6R12', tire_front: 'MH90-21', tire_rear: '150/80-16'
  },
  {
    make: 'Harley-Davidson', model: 'Sportster 1200', year_start: 2007, year_end: 2022,
    engine_type: 'v-twin', displacement_cc: 1202, category: 'cruiser',
    generation: 'EFI (2007-2022)', fuel_system: 'Electronic Sequential Port Fuel Injection',
    dry_weight_kg: 256, horsepower: 67, torque_nm: 84,
    fuel_capacity_liters: 12.5, oil_capacity_liters: 2.8,
    valve_clearance_intake: '0.001-0.003in', valve_clearance_exhaust: '0.002-0.004in',
    spark_plug: 'Harley 6R12', tire_front: 'MH90-21', tire_rear: '150/80-16'
  },
  {
    make: 'Kawasaki', model: 'Ninja 400', year_start: 2018, year_end: null,
    engine_type: 'parallel-twin', displacement_cc: 399, category: 'sport',
    fuel_system: 'EFI', dry_weight_kg: 168, horsepower: 49, torque_nm: 38,
    fuel_capacity_liters: 14, oil_capacity_liters: 2.3, coolant_capacity_liters: 2.0,
    valve_clearance_intake: '0.13-0.17mm', valve_clearance_exhaust: '0.20-0.24mm',
    spark_plug: 'NGK LMAR9G', tire_front: '110/70R17', tire_rear: '150/60R17'
  },
  {
    make: 'BMW', model: 'R1250GS', year_start: 2019, year_end: null,
    engine_type: 'boxer-twin', displacement_cc: 1254, category: 'adventure',
    fuel_system: 'EFI (ShiftCam)', dry_weight_kg: 249, horsepower: 136, torque_nm: 143,
    fuel_capacity_liters: 20, oil_capacity_liters: 4.0, coolant_capacity_liters: 1.5,
    valve_clearance_intake: '0.15-0.20mm', valve_clearance_exhaust: '0.30-0.35mm',
    spark_plug: 'NGK LMAR8BI-9', tire_front: '120/70R19', tire_rear: '170/60R17'
  },
]

async function main() {
  console.log('\nCrankDoc Reseed')
  console.log('===============\n')

  // Step 1: Clear existing data (respect FK order)
  console.log('Clearing existing data...')

  const tables = [
    'technical_documents',
    'motorcycle_images',
    'service_intervals',
    'diagnostic_trees',
    'dtc_codes',
    'motorcycles',
  ]

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) {
      console.error(`  ${table}: ERROR - ${error.message}`)
    } else {
      console.log(`  ${table}: cleared`)
    }
  }

  // Step 2: Insert generation-split motorcycles
  console.log('\nInserting motorcycles...')
  const { data, error } = await supabase.from('motorcycles').insert(motorcycles).select('id, make, model, generation')

  if (error) {
    console.error('FAILED:', error.message)
    process.exit(1)
  }

  console.log(`Inserted ${data.length} motorcycles:`)
  data.forEach(m => {
    const gen = m.generation ? ` [${m.generation}]` : ''
    console.log(`  ${m.make} ${m.model}${gen} -> ${m.id}`)
  })

  // Verify
  const { count } = await supabase.from('motorcycles').select('*', { count: 'exact', head: true })
  console.log(`\nTotal motorcycles in database: ${count}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
