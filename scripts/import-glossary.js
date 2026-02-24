#!/usr/bin/env node

/**
 * CrankDoc Glossary Import Script
 *
 * Reads glossary terms from data/glossary-terms.json and upserts them into Supabase.
 *
 * Usage: node scripts/import-glossary.js
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

const DATA_FILE = path.join(__dirname, '..', 'data', 'glossary-terms.json')

async function main() {
  console.log('\nCrankDoc Glossary Import')
  console.log('========================\n')

  if (!fs.existsSync(DATA_FILE)) {
    console.error(`File not found: ${DATA_FILE}`)
    process.exit(1)
  }

  const raw = fs.readFileSync(DATA_FILE, 'utf-8')
  const terms = JSON.parse(raw)

  if (!Array.isArray(terms)) {
    console.error('glossary-terms.json must be an array')
    process.exit(1)
  }

  console.log(`Found ${terms.length} glossary terms\n`)

  let success = 0
  let failed = 0

  // Process in batches of 50
  const batchSize = 50
  for (let i = 0; i < terms.length; i += batchSize) {
    const batch = terms.slice(i, i + batchSize)

    const rows = batch.map((term) => ({
      term: term.term,
      slug: term.slug,
      definition: term.definition,
      category: term.category,
      subcategory: term.subcategory || null,
      aliases: term.aliases || null,
      related_terms: term.related_terms || null,
      illustration_url: term.illustration_url || null,
      applies_to: term.applies_to || null,
      difficulty: term.difficulty || null,
    }))

    const { error } = await supabase
      .from('glossary_terms')
      .upsert(rows, { onConflict: 'slug' })

    if (error) {
      console.error(`  FAIL batch ${i}-${i + batch.length}: ${error.message}`)
      failed += batch.length
    } else {
      success += batch.length
      console.log(`  Batch ${i}-${i + batch.length}: ${batch.length} upserted`)
    }
  }

  console.log(`\nDone: ${success} imported, ${failed} failed`)

  // Count total terms in DB
  const { count } = await supabase
    .from('glossary_terms')
    .select('*', { count: 'exact', head: true })

  console.log(`Total glossary terms in database: ${count}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
