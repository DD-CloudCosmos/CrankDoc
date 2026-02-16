#!/usr/bin/env node

/**
 * CrankDoc Recall Import Script
 *
 * Fetches recall data from the NHTSA Recalls API for all motorcycles in the
 * database and upserts into the Supabase `recalls` table.
 *
 * Usage: node scripts/import-recalls.js
 *
 * The script:
 * 1. Loads all motorcycles from Supabase
 * 2. For each motorcycle, iterates year_start to year_end (capped at current year)
 * 3. Calls NHTSA for each make/model/year combo
 * 4. Deduplicates by nhtsa_campaign_number before upsert
 * 5. Throttles 200ms between API calls
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

const NHTSA_BASE_URL = 'https://api.nhtsa.gov/recalls/recallsByVehicle'
const THROTTLE_MS = 200
const MAX_RETRIES = 3
const CURRENT_YEAR = new Date().getFullYear()

/**
 * Model name aliases — NHTSA may not recognize CrankDoc's friendly names.
 * Try the primary name first; if 0 results, try alternates.
 */
const NHTSA_MODEL_ALIASES = {
  'Sportster 883': ['Sportster 883', 'XL883', 'XL883N', 'XL883L'],
  'Sportster 1200': ['Sportster 1200', 'XL1200', 'XL1200V', 'XL1200X', 'XL1200C'],
  'R1250GS': ['R 1250 GS', 'R1250GS'],
  'MT-07': ['MT-07', 'MT07', 'FZ-07'],
  'Ninja 400': ['Ninja 400', 'NINJA 400', 'EX400'],
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url)
      // NHTSA returns 400 for year/model combos it doesn't recognize — treat as "no data"
      if (response.status === 400) {
        return null
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      return await response.json()
    } catch (err) {
      if (attempt === retries) {
        console.error(`    FAIL after ${retries} attempts: ${err.message}`)
        return null
      }
      const delay = 500 * Math.pow(2, attempt - 1)
      await sleep(delay)
    }
  }
  return null
}

async function fetchRecallsForModel(make, model, year) {
  const url = `${NHTSA_BASE_URL}?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`
  const data = await fetchWithRetry(url)

  if (!data || !data.results || data.Count === 0) {
    return []
  }

  return data.results
}

function mapRecall(raw) {
  return {
    nhtsa_campaign_number: raw.NHTSACampaignNumber || '',
    data_source: 'nhtsa',
    manufacturer: raw.Manufacturer || '',
    make: raw.Make || '',
    model: raw.Model || '',
    model_year: parseInt(raw.ModelYear, 10) || 0,
    component: raw.Component || null,
    summary: raw.Summary || null,
    consequence: raw.Consequence || null,
    remedy: raw.Remedy || null,
    notes: raw.Notes || null,
    report_received_date: raw.ReportReceivedDate || null,
    park_it: raw.parkIt === true || raw.parkIt === 'Y',
    park_outside: raw.parkOutSide === true || raw.parkOutSide === 'Y',
  }
}

async function processMotorcycle(motorcycle) {
  const { make, model, year_start, year_end } = motorcycle
  const endYear = Math.min(year_end || CURRENT_YEAR, CURRENT_YEAR)

  console.log(`\n  ${make} ${model} (${year_start}-${endYear})`)

  const allRecalls = new Map() // Deduplicate by campaign number

  // Determine model names to try
  const modelNames = NHTSA_MODEL_ALIASES[model] || [model]

  for (let year = year_start; year <= endYear; year++) {
    let foundResults = false

    for (const modelName of modelNames) {
      const results = await fetchRecallsForModel(make, modelName, year)

      if (results.length > 0) {
        for (const raw of results) {
          const mapped = mapRecall(raw)
          const key = `${mapped.nhtsa_campaign_number}-${mapped.model_year}`
          if (!allRecalls.has(key)) {
            allRecalls.set(key, mapped)
          }
        }
        foundResults = true
        break // Found results with this name, skip alternates
      }

      await sleep(THROTTLE_MS)
    }

    if (!foundResults) {
      await sleep(THROTTLE_MS)
    }
  }

  const recalls = Array.from(allRecalls.values())

  if (recalls.length === 0) {
    console.log('    0 recalls found')
    return { found: 0, inserted: 0, skipped: 0 }
  }

  // Upsert in batches of 50
  let inserted = 0
  let skipped = 0
  const batchSize = 50

  for (let i = 0; i < recalls.length; i += batchSize) {
    const batch = recalls.slice(i, i + batchSize)

    const { error } = await supabase
      .from('recalls')
      .upsert(batch, {
        onConflict: 'nhtsa_campaign_number,model_year,data_source',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error(`    FAIL batch: ${error.message}`)
      skipped += batch.length
    } else {
      inserted += batch.length
    }
  }

  console.log(`    ${recalls.length} found, ${inserted} upserted, ${skipped} failed`)
  return { found: recalls.length, inserted, skipped }
}

async function main() {
  console.log('\nCrankDoc Recall Import')
  console.log('======================\n')

  // Load all motorcycles
  const { data: motorcycles, error } = await supabase
    .from('motorcycles')
    .select('*')
    .order('make')
    .order('model')

  if (error) {
    console.error('Error loading motorcycles:', error.message)
    process.exit(1)
  }

  console.log(`Found ${motorcycles.length} motorcycles`)

  let totalFound = 0
  let totalInserted = 0
  let totalSkipped = 0

  for (const moto of motorcycles) {
    const { found, inserted, skipped } = await processMotorcycle(moto)
    totalFound += found
    totalInserted += inserted
    totalSkipped += skipped
  }

  console.log('\n======================')
  console.log(`Done: ${totalFound} recalls found, ${totalInserted} upserted, ${totalSkipped} failed`)

  // Count total recalls in DB
  const { count } = await supabase
    .from('recalls')
    .select('*', { count: 'exact', head: true })

  console.log(`Total recalls in database: ${count}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
