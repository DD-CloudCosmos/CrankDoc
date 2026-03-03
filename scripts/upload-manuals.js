#!/usr/bin/env node

/**
 * Upload Manual PDFs to Supabase Storage
 *
 * Reads local PDFs from data/manuals/, uploads to the `service-manuals` Storage bucket,
 * and upserts document_sources rows so the admin coverage dashboard works in production.
 *
 * Usage: node scripts/upload-manuals.js
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
const MANUALS_DIR = path.join(__dirname, '..', 'data', 'manuals')
const BUCKET = 'service-manuals'

// --- Filename Parsing (inline, matches src/lib/manuals.ts logic) ---

const FILENAME_TYPE_KEYWORDS = {
  service: 'service_manual',
  workshop: 'service_manual',
  owners: 'owners_manual',
  owner: 'owners_manual',
  riders: 'owners_manual',
  rider: 'owners_manual',
  parts: 'parts_catalog',
  tsb: 'tsb',
  bulletin: 'tsb',
}

function parseManualFilename(filename) {
  if (!filename.endsWith('.pdf')) return null

  const basename = filename.replace('.pdf', '')
  const parts = basename.split('-')

  if (parts.length < 3) return null

  const make = parts[0]

  let manualType = null
  let typeIndex = -1

  for (let i = 1; i < parts.length; i++) {
    const keyword = parts[i].toLowerCase()
    if (FILENAME_TYPE_KEYWORDS[keyword]) {
      manualType = FILENAME_TYPE_KEYWORDS[keyword]
      typeIndex = i
      break
    }
  }

  if (!manualType || typeIndex < 2) return null

  const model = parts.slice(1, typeIndex).join('')

  let year = null
  for (let i = typeIndex + 1; i < parts.length; i++) {
    const num = parseInt(parts[i], 10)
    if (!isNaN(num) && num >= 1900 && num <= 2100) {
      year = num
      break
    }
  }

  return { make, model, manualType, year }
}

// --- Normalization (matches src/lib/manuals.ts) ---

function normalizeForMatch(str) {
  return str.toLowerCase().replace(/[\s\-_.]/g, '')
}

// --- Bucket Setup ---

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = buckets && buckets.some((b) => b.name === BUCKET)
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 52428800, // 50 MB — Supabase free tier limit
    })
    if (error) {
      console.error('Failed to create bucket:', error.message)
      process.exit(1)
    }
    console.log(`Created storage bucket: ${BUCKET}`)
  } else {
    console.log(`Storage bucket exists: ${BUCKET}`)
  }
}

// --- Motorcycle ID Lookup ---

async function findMotorcycleId(make, model) {
  const { data, error } = await supabase
    .from('motorcycles')
    .select('id, make, model')

  if (error || !data) return null

  const normalizedMake = normalizeForMatch(make)
  const normalizedModel = normalizeForMatch(model)

  const match = data.find(
    (m) =>
      normalizeForMatch(m.make) === normalizedMake &&
      normalizeForMatch(m.model) === normalizedModel
  )

  return match ? match.id : null
}

// --- Main ---

async function main() {
  console.log('\nCrankDoc Manual Upload')
  console.log('======================\n')

  if (!fs.existsSync(MANUALS_DIR)) {
    console.error(`Directory not found: ${MANUALS_DIR}`)
    process.exit(1)
  }

  await ensureBucket()

  const files = fs.readdirSync(MANUALS_DIR).filter((f) => f.endsWith('.pdf'))
  console.log(`Found ${files.length} PDF files in data/manuals/\n`)

  let uploaded = 0
  let upserted = 0

  for (const filename of files) {
    const parsed = parseManualFilename(filename)
    if (!parsed) {
      console.log(`SKIP ${filename} — could not parse filename`)
      continue
    }

    console.log(`${filename}`)
    console.log(`  make: ${parsed.make}, model: ${parsed.model}, type: ${parsed.manualType}`)

    // Read file and compute hash
    const filepath = path.join(MANUALS_DIR, filename)
    const buffer = fs.readFileSync(filepath)
    const fileHash = crypto.createHash('md5').update(buffer).digest('hex')
    const sizeMB = (buffer.length / (1024 * 1024)).toFixed(1)
    console.log(`  size: ${sizeMB} MB, hash: ${fileHash}`)

    // Upload to Storage
    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(filename, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadErr) {
      console.error(`  Upload FAILED: ${uploadErr.message}`)
      continue
    }

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filename)

    console.log(`  Uploaded -> ${publicUrl}`)
    uploaded++

    // Look up motorcycle_id
    const motorcycleId = await findMotorcycleId(parsed.make, parsed.model)
    if (motorcycleId) {
      console.log(`  Matched motorcycle_id: ${motorcycleId}`)
    } else {
      console.log(`  No motorcycle match (will still create document_source)`)
    }

    // Upsert document_sources row
    const title = `${parsed.make} ${parsed.model} ${parsed.manualType.replace('_', ' ')}${parsed.year ? ` (${parsed.year})` : ''}`
    const row = {
      title,
      source_type: 'pdf',
      file_path: publicUrl,
      file_hash: fileHash,
      motorcycle_id: motorcycleId,
      make: parsed.make,
      model: parsed.model,
      manual_type: parsed.manualType,
      processing_status: 'pending',
    }

    const { error: upsertErr } = await supabase
      .from('document_sources')
      .upsert(row, { onConflict: 'file_hash' })

    if (upsertErr) {
      console.error(`  Upsert FAILED: ${upsertErr.message}`)
    } else {
      console.log(`  Upserted document_source: ${title}`)
      upserted++
    }

    console.log()
  }

  console.log('=== Summary ===')
  console.log(`PDFs uploaded to Storage: ${uploaded}`)
  console.log(`document_sources upserted: ${upserted}`)

  const { count } = await supabase
    .from('document_sources')
    .select('*', { count: 'exact', head: true })
    .eq('source_type', 'pdf')
  console.log(`Total PDF document_sources: ${count}`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
