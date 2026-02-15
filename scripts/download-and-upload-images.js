#!/usr/bin/env node

/**
 * CrankDoc Image Pipeline
 *
 * Downloads motorcycle photos from Wikimedia Commons (1280px thumbnails),
 * uploads to Supabase Storage, and inserts records into motorcycle_images.
 *
 * Usage: node scripts/download-and-upload-images.js
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
const LOCAL_DIR = path.join(__dirname, '..', 'data', 'images')
const BUCKET = 'motorcycle-images'

// Image selections: { filename, url, make, model, generation, alt, attribution }
const images = [
  {
    filename: 'honda-cbr600rr.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Honda_CBR600RR_2006_WSS.jpg/1280px-Honda_CBR600RR_2006_WSS.jpg',
    make: 'Honda',
    model: 'CBR600RR',
    generations: [
      'Gen 1 (2003-2004)',
      'Gen 2 (2005-2006)',
      'Gen 3 (2007-2012)',
      'Gen 4 (2013-2024)',
    ],
    alt: 'Honda CBR600RR sport motorcycle, side profile',
    attribution: 'Rikita, Wikimedia Commons, CC BY-SA 4.0',
  },
  {
    filename: 'yamaha-mt07.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/2021_Black_Yamaha_MT-07.jpg/1280px-2021_Black_Yamaha_MT-07.jpg',
    make: 'Yamaha',
    model: 'MT-07',
    generations: [null],
    alt: 'Yamaha MT-07 naked motorcycle, side profile in black',
    attribution: 'PackMecEng, Wikimedia Commons, CC BY-SA 4.0',
  },
  {
    filename: 'harley-sportster883-carb.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Harley_Davidson_883_Sportster_1997_%2814122005799%29.jpg/1280px-Harley_Davidson_883_Sportster_1997_%2814122005799%29.jpg',
    make: 'Harley-Davidson',
    model: 'Sportster 883',
    generations: ['Carbureted (1986-2006)'],
    alt: 'Harley-Davidson Sportster 883 carbureted model, 1997',
    attribution: 'order_242, Wikimedia Commons, CC BY-SA 2.0',
  },
  {
    filename: 'harley-sportster883-efi.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Harley_Davidson_XL_883_Sporster_2013_%2814122046290%29.jpg/1280px-Harley_Davidson_XL_883_Sporster_2013_%2814122046290%29.jpg',
    make: 'Harley-Davidson',
    model: 'Sportster 883',
    generations: ['EFI (2007-2022)'],
    alt: 'Harley-Davidson Sportster 883 EFI model, 2013',
    attribution: 'order_242, Wikimedia Commons, CC BY-SA 2.0',
  },
  {
    filename: 'harley-sportster1200-carb.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Harley_Davidson_XL_1200.JPG/1280px-Harley_Davidson_XL_1200.JPG',
    make: 'Harley-Davidson',
    model: 'Sportster 1200',
    generations: ['Carbureted (1988-2006)'],
    alt: 'Harley-Davidson Sportster 1200 carbureted model',
    attribution: 'Ad Meskens, Wikimedia Commons, CC BY-SA 3.0',
  },
  {
    filename: 'harley-sportster1200-efi.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Harley_Davidson_1200_Forty_Eight_%2816529970242%29.jpg/1280px-Harley_Davidson_1200_Forty_Eight_%2816529970242%29.jpg',
    make: 'Harley-Davidson',
    model: 'Sportster 1200',
    generations: ['EFI (2007-2022)'],
    alt: 'Harley-Davidson Sportster 1200 Forty-Eight EFI model',
    attribution: 'Bob Adams, Wikimedia Commons, CC BY-SA 2.0',
  },
  {
    filename: 'kawasaki-ninja400.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Kawasaki_Ninja_400.jpg/1280px-Kawasaki_Ninja_400.jpg',
    make: 'Kawasaki',
    model: 'Ninja 400',
    generations: [null],
    alt: 'Kawasaki Ninja 400 sport motorcycle, side profile',
    attribution: 'Rikita, Wikimedia Commons, CC BY-SA 4.0',
  },
  {
    filename: 'bmw-r1250gs.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/BMW_R_1250_GS_%281%29.jpg/1280px-BMW_R_1250_GS_%281%29.jpg',
    make: 'BMW',
    model: 'R1250GS',
    generations: [null],
    alt: 'BMW R1250GS adventure motorcycle',
    attribution: 'Cjp24, Wikimedia Commons, CC BY-SA 4.0',
  },
]

async function downloadImage(url, filepath) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'CrankDoc/1.0 (motorcycle diagnostic app)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(filepath, buffer)
  return buffer
}

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = buckets && buckets.some((b) => b.name === BUCKET)
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 10485760, // 10MB
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

async function getMotorcycleId(make, model, generation) {
  let query = supabase
    .from('motorcycles')
    .select('id')
    .eq('make', make)
    .eq('model', model)

  if (generation) {
    query = query.eq('generation', generation)
  } else {
    query = query.is('generation', null)
  }

  const { data, error } = await query.limit(1).single()
  if (error) {
    console.warn(
      `  Warning: Could not find ${make} ${model}${generation ? ' [' + generation + ']' : ''}`
    )
    return null
  }
  return data.id
}

async function main() {
  console.log('\nCrankDoc Image Pipeline')
  console.log('=======================\n')

  // Ensure local directory exists
  if (!fs.existsSync(LOCAL_DIR)) {
    fs.mkdirSync(LOCAL_DIR, { recursive: true })
  }

  // Create bucket if needed
  await ensureBucket()

  // Clear existing motorcycle_images
  const { error: clearErr } = await supabase
    .from('motorcycle_images')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (clearErr) {
    console.warn('Warning clearing images:', clearErr.message)
  }

  let uploaded = 0
  let dbInserted = 0

  for (const img of images) {
    console.log(`\n${img.make} ${img.model} — ${img.filename}`)

    // Step 1: Download
    const localPath = path.join(LOCAL_DIR, img.filename)
    let buffer
    if (fs.existsSync(localPath)) {
      console.log('  Already downloaded locally')
      buffer = fs.readFileSync(localPath)
    } else {
      console.log('  Downloading from Wikimedia...')
      buffer = await downloadImage(img.url, localPath)
      console.log(`  Downloaded: ${(buffer.length / 1024).toFixed(0)} KB`)
    }

    // Step 2: Upload to Supabase Storage
    const storagePath = img.filename
    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (uploadErr) {
      console.error(`  Upload FAILED: ${uploadErr.message}`)
      continue
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
    console.log(`  Uploaded -> ${publicUrl}`)
    uploaded++

    // Step 3: Insert DB records for each generation
    for (const gen of img.generations) {
      const motorcycleId = await getMotorcycleId(img.make, img.model, gen)
      if (!motorcycleId) continue

      const { error: insertErr } = await supabase
        .from('motorcycle_images')
        .insert({
          motorcycle_id: motorcycleId,
          image_url: publicUrl,
          alt_text: img.alt,
          is_primary: true,
          source_attribution: img.attribution,
        })

      if (insertErr) {
        console.error(`  DB insert FAILED for ${gen || 'default'}: ${insertErr.message}`)
      } else {
        const genLabel = gen ? ` [${gen}]` : ''
        console.log(`  DB record created for ${img.make} ${img.model}${genLabel}`)
        dbInserted++
      }
    }
  }

  console.log(`\n=== Summary ===`)
  console.log(`Images uploaded to Storage: ${uploaded}`)
  console.log(`DB records created: ${dbInserted}`)

  const { count } = await supabase
    .from('motorcycle_images')
    .select('*', { count: 'exact', head: true })
  console.log(`Total motorcycle_images rows: ${count}`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
