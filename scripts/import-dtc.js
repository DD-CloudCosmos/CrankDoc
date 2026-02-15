#!/usr/bin/env node

/**
 * CrankDoc DTC Import Script
 *
 * Reads DTC code JSON files from data/dtc/ and upserts them into Supabase.
 *
 * Usage: node scripts/import-dtc.js
 *
 * JSON file format (array of objects):
 * [
 *   {
 *     "code": "P0301",
 *     "description": "Cylinder 1 Misfire Detected",
 *     "category": "powertrain",
 *     "subcategory": "ignition",
 *     "severity": "high",
 *     "common_causes": ["Faulty spark plug", ...],
 *     "applies_to_makes": ["Harley-Davidson"],  // optional
 *     "manufacturer": "Harley-Davidson",         // optional
 *     "system": "Engine Management",             // optional
 *     "diagnostic_method": "OBD-II scanner",     // optional
 *     "fix_reference": "Replace spark plug"      // optional
 *   }
 * ]
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

const DTC_DIR = path.join(__dirname, '..', 'data', 'dtc')

async function importFile(filePath) {
  const fileName = path.basename(filePath)
  const raw = fs.readFileSync(filePath, 'utf-8')
  const codes = JSON.parse(raw)

  if (!Array.isArray(codes)) {
    console.error(`  SKIP ${fileName}: not an array`)
    return { success: 0, failed: 0 }
  }

  let success = 0
  let failed = 0

  // Process in batches of 50
  const batchSize = 50
  for (let i = 0; i < codes.length; i += batchSize) {
    const batch = codes.slice(i, i + batchSize)

    const rows = batch.map((code) => ({
      code: code.code,
      description: code.description,
      category: code.category || null,
      subcategory: code.subcategory || null,
      severity: code.severity || null,
      common_causes: code.common_causes || null,
      applies_to_makes: code.applies_to_makes || null,
      manufacturer: code.manufacturer || null,
      system: code.system || null,
      diagnostic_method: code.diagnostic_method || null,
      fix_reference: code.fix_reference || null,
    }))

    const { error } = await supabase
      .from('dtc_codes')
      .upsert(rows, { onConflict: 'code' })

    if (error) {
      console.error(`  FAIL batch ${i}-${i + batch.length} in ${fileName}: ${error.message}`)
      failed += batch.length
    } else {
      success += batch.length
    }
  }

  console.log(`  ${fileName}: ${success} imported, ${failed} failed`)
  return { success, failed }
}

async function main() {
  console.log('\nCrankDoc DTC Import')
  console.log('===================\n')

  if (!fs.existsSync(DTC_DIR)) {
    console.error(`Directory not found: ${DTC_DIR}`)
    process.exit(1)
  }

  const files = fs.readdirSync(DTC_DIR).filter((f) => f.endsWith('.json')).sort()

  if (files.length === 0) {
    console.log('No JSON files found in data/dtc/')
    process.exit(0)
  }

  console.log(`Found ${files.length} DTC files\n`)

  let totalSuccess = 0
  let totalFailed = 0

  for (const file of files) {
    const { success, failed } = await importFile(path.join(DTC_DIR, file))
    totalSuccess += success
    totalFailed += failed
  }

  console.log(`\nDone: ${totalSuccess} imported, ${totalFailed} failed`)

  // Count total codes in DB
  const { count } = await supabase
    .from('dtc_codes')
    .select('*', { count: 'exact', head: true })

  console.log(`Total DTC codes in database: ${count}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
