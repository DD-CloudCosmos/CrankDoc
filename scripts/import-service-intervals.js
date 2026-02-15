#!/usr/bin/env node

/**
 * CrankDoc Service Intervals Import Script
 *
 * Reads service interval JSON files from data/service-intervals/ and upserts
 * them into Supabase. Links intervals to motorcycles by make + model lookup.
 *
 * Usage: node scripts/import-service-intervals.js
 *
 * JSON file format:
 * {
 *   "motorcycle_make": "Honda",
 *   "motorcycle_model": "CBR600RR",
 *   "intervals": [
 *     {
 *       "service_name": "Engine Oil Change",
 *       "interval_miles": 8000,
 *       "interval_km": 12800,
 *       "interval_months": 12,
 *       "description": "Replace engine oil and filter."
 *     }
 *   ]
 * }
 */

const fs = require('fs')
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

const INTERVALS_DIR = path.join(__dirname, '..', 'data', 'service-intervals')

async function getMotorcycleId(make, model, generation) {
  let query = supabase
    .from('motorcycles')
    .select('id')
    .eq('make', make)
    .eq('model', model)

  if (generation) {
    query = query.eq('generation', generation)
  }

  const { data, error } = await query.limit(1).single()

  if (error) {
    const genLabel = generation ? ` [${generation}]` : ''
    console.warn(`  Warning: Could not find motorcycle ${make} ${model}${genLabel}`)
    return null
  }
  return data.id
}

async function importFile(filePath) {
  const fileName = path.basename(filePath)
  const raw = fs.readFileSync(filePath, 'utf-8')
  const data = JSON.parse(raw)

  if (!data.motorcycle_make || !data.motorcycle_model || !Array.isArray(data.intervals)) {
    console.error(`  SKIP ${fileName}: missing motorcycle_make, motorcycle_model, or intervals array`)
    return { success: 0, failed: 0 }
  }

  const motorcycleId = await getMotorcycleId(data.motorcycle_make, data.motorcycle_model, data.motorcycle_generation)
  if (!motorcycleId) {
    console.error(`  SKIP ${fileName}: motorcycle not found in database`)
    return { success: 0, failed: 0 }
  }

  // Delete existing intervals for this motorcycle before importing
  const { error: deleteError } = await supabase
    .from('service_intervals')
    .delete()
    .eq('motorcycle_id', motorcycleId)

  if (deleteError) {
    console.warn(`  Warning: Could not clear existing intervals for ${data.motorcycle_make} ${data.motorcycle_model}`)
  }

  const rows = data.intervals.map((interval) => ({
    motorcycle_id: motorcycleId,
    service_name: interval.service_name,
    interval_miles: interval.interval_miles || null,
    interval_km: interval.interval_km || null,
    interval_months: interval.interval_months || null,
    description: interval.description || null,
  }))

  const { error } = await supabase
    .from('service_intervals')
    .insert(rows)

  if (error) {
    console.error(`  FAIL ${fileName}: ${error.message}`)
    return { success: 0, failed: rows.length }
  }

  console.log(`  INSERT ${fileName}: ${rows.length} intervals for ${data.motorcycle_make} ${data.motorcycle_model}`)
  return { success: rows.length, failed: 0 }
}

async function main() {
  console.log('\nCrankDoc Service Intervals Import')
  console.log('=================================\n')

  if (!fs.existsSync(INTERVALS_DIR)) {
    console.error(`Directory not found: ${INTERVALS_DIR}`)
    process.exit(1)
  }

  const files = fs.readdirSync(INTERVALS_DIR).filter((f) => f.endsWith('.json')).sort()

  if (files.length === 0) {
    console.log('No JSON files found in data/service-intervals/')
    process.exit(0)
  }

  console.log(`Found ${files.length} service interval files\n`)

  let totalSuccess = 0
  let totalFailed = 0

  for (const file of files) {
    const { success, failed } = await importFile(path.join(INTERVALS_DIR, file))
    totalSuccess += success
    totalFailed += failed
  }

  console.log(`\nDone: ${totalSuccess} imported, ${totalFailed} failed`)

  // Count total intervals in DB
  const { count } = await supabase
    .from('service_intervals')
    .select('*', { count: 'exact', head: true })

  console.log(`Total service intervals in database: ${count}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
