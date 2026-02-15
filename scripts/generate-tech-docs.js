#!/usr/bin/env node

/**
 * CrankDoc Technical Document Generator
 *
 * Generates SVG reference documents from database data:
 * - Torque specification charts
 * - Fluid capacity charts
 * - Simplified electrical system block diagrams
 *
 * Then uploads to Supabase Storage and updates technical_documents table.
 *
 * Usage: node scripts/generate-tech-docs.js
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const LOCAL_DIR = path.join(__dirname, '..', 'data', 'tech-docs')
const BUCKET = 'technical-docs'

// ============================================================
// SVG Generators
// ============================================================

function svgHeader(width, height, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&amp;display=swap');
      text { font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; }
      .title { font-size: 22px; font-weight: 700; fill: #1a1a1a; }
      .subtitle { font-size: 13px; font-weight: 400; fill: #666; }
      .header { font-size: 12px; font-weight: 600; fill: #fff; }
      .cell { font-size: 11px; fill: #333; }
      .cell-bold { font-size: 11px; font-weight: 600; fill: #1a1a1a; }
      .section { font-size: 14px; font-weight: 600; fill: #8B6914; }
      .note { font-size: 10px; fill: #888; }
      .block-label { font-size: 11px; font-weight: 600; fill: #fff; text-anchor: middle; }
      .block-sub { font-size: 9px; fill: #ddd; text-anchor: middle; }
      .wire-label { font-size: 9px; fill: #666; }
    </style>
  </defs>
  <rect width="${width}" height="${height}" fill="#FAFAF5" rx="8"/>
  <text x="${width / 2}" y="35" class="title" text-anchor="middle">${escXml(title)}</text>`
}

function escXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// --- Torque Chart ---
function generateTorqueChart(make, model, intervals) {
  const torqueItems = intervals.filter((i) => i.torque_spec)
  if (torqueItems.length === 0) return null

  const rowH = 32
  const headerY = 70
  const tableTop = headerY + 30
  const height = tableTop + torqueItems.length * rowH + 60
  const width = 600

  let svg = svgHeader(width, height, `${make} ${model} — Torque Specifications`)
  svg += `\n  <text x="${width / 2}" y="55" class="subtitle" text-anchor="middle">Service torque values for critical fasteners</text>`

  // Table header
  svg += `\n  <rect x="30" y="${headerY}" width="540" height="26" rx="4" fill="#8B6914"/>`
  svg += `\n  <text x="45" y="${headerY + 18}" class="header">Service Item</text>`
  svg += `\n  <text x="350" y="${headerY + 18}" class="header">Torque Specification</text>`

  // Rows
  torqueItems.forEach((item, i) => {
    const y = tableTop + i * rowH
    const bg = i % 2 === 0 ? '#F5F0E6' : '#FAFAF5'
    svg += `\n  <rect x="30" y="${y}" width="540" height="${rowH}" fill="${bg}"/>`
    svg += `\n  <text x="45" y="${y + 20}" class="cell-bold">${escXml(item.service_name)}</text>`
    svg += `\n  <text x="350" y="${y + 20}" class="cell">${escXml(item.torque_spec)}</text>`
  })

  // Border
  const tableBottom = tableTop + torqueItems.length * rowH
  svg += `\n  <rect x="30" y="${headerY}" width="540" height="${tableBottom - headerY}" rx="4" fill="none" stroke="#D4C9A8" stroke-width="1"/>`

  svg += `\n  <text x="${width / 2}" y="${height - 15}" class="note" text-anchor="middle">CrankDoc Reference — Values from service manual specifications</text>`
  svg += '\n</svg>'
  return svg
}

// --- Fluid Chart ---
function generateFluidChart(make, model, motorcycle, intervals) {
  const width = 600
  let items = []

  if (motorcycle.oil_capacity_liters) {
    const oilSpec = intervals.find((i) => i.fluid_spec && i.service_name.toLowerCase().includes('oil'))
    items.push({
      label: 'Engine Oil',
      capacity: `${motorcycle.oil_capacity_liters} L`,
      spec: oilSpec ? oilSpec.fluid_spec : null,
    })
  }
  if (motorcycle.coolant_capacity_liters) {
    items.push({
      label: 'Coolant',
      capacity: `${motorcycle.coolant_capacity_liters} L`,
      spec: null,
    })
  }
  if (motorcycle.fuel_capacity_liters) {
    items.push({ label: 'Fuel Tank', capacity: `${motorcycle.fuel_capacity_liters} L`, spec: null })
  }

  // Add fluid specs from intervals
  const brakeFluid = intervals.find(
    (i) => i.fluid_spec && i.service_name.toLowerCase().includes('brake')
  )
  if (brakeFluid) {
    items.push({ label: 'Brake Fluid', capacity: null, spec: brakeFluid.fluid_spec })
  }
  const forkOil = intervals.find(
    (i) => i.fluid_spec && i.service_name.toLowerCase().includes('fork')
  )
  if (forkOil) {
    items.push({ label: 'Fork Oil', capacity: null, spec: forkOil.fluid_spec })
  }

  if (items.length === 0) return null

  const cardH = 70
  const startY = 75
  const height = startY + items.length * cardH + 50
  let svg = svgHeader(width, height, `${make} ${model} — Fluid Capacities & Specs`)
  svg += `\n  <text x="${width / 2}" y="55" class="subtitle" text-anchor="middle">Oil, coolant, fuel, and fluid specifications</text>`

  items.forEach((item, i) => {
    const y = startY + i * cardH
    const bg = i % 2 === 0 ? '#F5F0E6' : '#FAFAF5'
    svg += `\n  <rect x="30" y="${y}" width="540" height="${cardH - 6}" rx="6" fill="${bg}" stroke="#D4C9A8" stroke-width="0.5"/>`
    svg += `\n  <text x="50" y="${y + 25}" class="cell-bold" style="font-size:14px">${escXml(item.label)}</text>`
    if (item.capacity) {
      svg += `\n  <text x="50" y="${y + 45}" class="cell">Capacity: ${escXml(item.capacity)}</text>`
    }
    if (item.spec) {
      const specX = item.capacity ? 250 : 50
      const specY = item.capacity ? y + 45 : y + 45
      svg += `\n  <text x="${specX}" y="${specY}" class="cell">Spec: ${escXml(item.spec)}</text>`
    }
  })

  svg += `\n  <text x="${width / 2}" y="${height - 15}" class="note" text-anchor="middle">CrankDoc Reference — Values from service manual specifications</text>`
  svg += '\n</svg>'
  return svg
}

// --- Wiring Diagram (Simplified Block Diagram) ---
function generateWiringDiagram(make, model, engineType, fuelSystem) {
  const width = 700
  const height = 520

  let svg = svgHeader(width, height, `${make} ${model} — Electrical System Overview`)
  svg += `\n  <text x="${width / 2}" y="55" class="subtitle" text-anchor="middle">Simplified block diagram — not a full service manual schematic</text>`

  // Define blocks based on motorcycle type
  const isEFI = fuelSystem && fuelSystem.toLowerCase().includes('efi')
  const isCarb = fuelSystem && fuelSystem.toLowerCase().includes('carb')
  const hasCAN =
    make === 'BMW' ||
    (make === 'Harley-Davidson' && fuelSystem && fuelSystem.includes('Electronic'))

  function block(x, y, w, h, color, label, sub) {
    let s = `\n  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${color}" stroke="#333" stroke-width="1.5"/>`
    s += `\n  <text x="${x + w / 2}" y="${y + h / 2 + (sub ? -3 : 4)}" class="block-label">${escXml(label)}</text>`
    if (sub)
      s += `\n  <text x="${x + w / 2}" y="${y + h / 2 + 12}" class="block-sub">${escXml(sub)}</text>`
    return s
  }

  function wire(x1, y1, x2, y2, color, label) {
    let s = `\n  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color || '#555'}" stroke-width="1.5"/>`
    if (label) {
      const mx = (x1 + x2) / 2
      const my = (y1 + y2) / 2
      s += `\n  <text x="${mx + 5}" y="${my - 4}" class="wire-label">${escXml(label)}</text>`
    }
    return s
  }

  // Battery (center-left)
  svg += block(40, 180, 110, 50, '#C0392B', 'Battery', '12V')

  // Starter Motor
  svg += block(40, 280, 110, 45, '#7F8C8D', 'Starter Motor', '')

  // Starter Relay
  svg += block(40, 370, 110, 40, '#95A5A6', 'Starter Relay', '')

  // Kill Switch / Ignition
  svg += block(200, 80, 120, 40, '#2C3E50', 'Ignition Switch', 'Kill Switch')

  // Fuse Box
  svg += block(200, 180, 120, 50, '#E67E22', 'Fuse Box', 'Main + Aux')

  // ECU / CDI
  if (isEFI || hasCAN) {
    svg += block(200, 280, 120, 50, '#2980B9', 'ECU', 'Engine Mgmt')
  } else if (isCarb) {
    svg += block(200, 280, 120, 50, '#2980B9', 'CDI Unit', 'Ignition')
  } else {
    svg += block(200, 280, 120, 50, '#2980B9', 'ECU / CDI', 'Control')
  }

  // Charging System
  svg += block(380, 80, 120, 40, '#27AE60', 'Stator', 'AC Generator')
  svg += block(380, 150, 120, 40, '#27AE60', 'Reg/Rectifier', 'AC → DC')

  // Ignition Coils
  svg += block(380, 230, 120, 45, '#8E44AD', 'Ignition Coils', '')

  // Spark Plugs
  svg += block(380, 310, 120, 40, '#8E44AD', 'Spark Plugs', '')

  // Fuel System
  if (isEFI) {
    svg += block(380, 390, 120, 45, '#D35400', 'Fuel Injectors', 'EFI')
    svg += block(540, 390, 120, 45, '#D35400', 'Fuel Pump', '')
  }

  // Lights
  svg += block(540, 80, 120, 40, '#F1C40F', 'Headlight', '')
  svg += block(540, 150, 120, 40, '#F1C40F', 'Tail / Brake', '')
  svg += block(540, 220, 120, 40, '#F1C40F', 'Turn Signals', '')

  // Instruments
  svg += block(540, 300, 120, 45, '#1ABC9C', 'Instrument', 'Cluster')

  // CAN Bus line (if applicable)
  if (hasCAN) {
    svg += `\n  <line x1="200" y1="460" x2="660" y2="460" stroke="#E74C3C" stroke-width="3" stroke-dasharray="8,4"/>`
    svg += `\n  <text x="430" y="478" class="wire-label" style="fill:#E74C3C;font-weight:600" text-anchor="middle">CAN Bus</text>`
    // Connections to CAN
    svg += wire(260, 330, 260, 460, '#E74C3C', '')
    svg += wire(440, 345, 440, 460, '#E74C3C', '')
    svg += wire(600, 345, 600, 460, '#E74C3C', '')
  }

  // Wires: Battery connections
  svg += wire(150, 195, 200, 195, '#C0392B', '+12V')
  svg += wire(150, 215, 150, 280, '#555', '')
  svg += wire(150, 280, 150, 302, '#555', '')
  svg += wire(95, 230, 95, 280, '#555', '')
  svg += wire(95, 325, 95, 370, '#555', '')

  // Ignition to Fuse
  svg += wire(260, 120, 260, 180, '#2C3E50', '')

  // Fuse to ECU
  svg += wire(260, 230, 260, 280, '#E67E22', '')

  // Stator to Reg/Rectifier
  svg += wire(440, 120, 440, 150, '#27AE60', 'AC')

  // Reg/Rectifier to Fuse (charging)
  svg += wire(380, 170, 320, 195, '#27AE60', 'DC')

  // ECU to Coils
  svg += wire(320, 305, 380, 252, '#2980B9', '')

  // Coils to Plugs
  svg += wire(440, 275, 440, 310, '#8E44AD', '')

  // ECU to Injectors
  if (isEFI) {
    svg += wire(320, 305, 380, 412, '#D35400', '')
    svg += wire(500, 412, 540, 412, '#D35400', '')
  }

  // Fuse to Lights
  svg += wire(320, 195, 540, 100, '#F1C40F', '')
  svg += wire(320, 205, 540, 170, '#F1C40F', '')
  svg += wire(320, 210, 540, 240, '#F1C40F', '')

  // Fuse to Instruments
  svg += wire(320, 215, 540, 322, '#1ABC9C', '')

  svg += `\n  <text x="${width / 2}" y="${height - 10}" class="note" text-anchor="middle">CrankDoc Reference — Simplified overview, consult service manual for full wiring</text>`
  svg += '\n</svg>'
  return svg
}

// ============================================================
// Main Pipeline
// ============================================================

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = buckets && buckets.some((b) => b.name === BUCKET)
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 10485760,
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

async function main() {
  console.log('\nCrankDoc Technical Document Generator')
  console.log('=====================================\n')

  if (!fs.existsSync(LOCAL_DIR)) fs.mkdirSync(LOCAL_DIR, { recursive: true })
  await ensureBucket()

  // Fetch all motorcycles and service intervals
  const { data: motorcycles } = await supabase
    .from('motorcycles')
    .select('id, make, model, generation, engine_type, fuel_system, oil_capacity_liters, coolant_capacity_liters, fuel_capacity_liters')
    .order('make')
    .order('model')

  const { data: allIntervals } = await supabase
    .from('service_intervals')
    .select('*')

  // Fetch existing docs to update
  const { data: existingDocs } = await supabase.from('technical_documents').select('*')

  let generated = 0
  let uploaded = 0

  // For each unique model (not generation), generate docs
  const models = new Map()
  for (const m of motorcycles) {
    const key = `${m.make}|${m.model}`
    if (!models.has(key)) {
      models.set(key, { ...m, motorcycleIds: [m.id] })
    } else {
      models.get(key).motorcycleIds.push(m.id)
    }
  }

  for (const [key, moto] of models) {
    const intervals = allIntervals.filter((i) => moto.motorcycleIds.includes(i.motorcycle_id))
    const slug = `${moto.make.toLowerCase().replace(/[^a-z0-9]/g, '')}-${moto.model.toLowerCase().replace(/[^a-z0-9]/g, '')}`

    console.log(`\n--- ${moto.make} ${moto.model} ---`)

    // 1. Torque Chart
    const torqueSvg = generateTorqueChart(moto.make, moto.model, intervals)
    if (torqueSvg) {
      const filename = `torque-${slug}.svg`
      const localPath = path.join(LOCAL_DIR, filename)
      fs.writeFileSync(localPath, torqueSvg)
      generated++

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filename, Buffer.from(torqueSvg), { contentType: 'image/svg+xml', upsert: true })
      if (error) {
        console.error(`  Upload failed ${filename}:`, error.message)
      } else {
        const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename)
        console.log(`  Torque chart -> ${publicUrl}`)
        uploaded++

        // Update existing DB record if found
        const existing = existingDocs.find(
          (d) => d.doc_type === 'torque_chart' && d.title.includes(moto.model)
        )
        if (existing) {
          await supabase
            .from('technical_documents')
            .update({ file_url: publicUrl, file_type: 'image/svg+xml', source_attribution: 'CrankDoc generated from service manual data' })
            .eq('id', existing.id)
          console.log(`  Updated DB record: ${existing.title}`)
        } else {
          // Insert for first motorcycle ID
          await supabase.from('technical_documents').insert({
            motorcycle_id: moto.motorcycleIds[0],
            title: `${moto.model} Torque Specifications`,
            doc_type: 'torque_chart',
            description: `Torque values for critical fasteners on the ${moto.make} ${moto.model}.`,
            file_url: publicUrl,
            file_type: 'image/svg+xml',
            source_attribution: 'CrankDoc generated from service manual data',
          })
          console.log(`  Created DB record: ${moto.model} Torque Specifications`)
        }
      }
    } else {
      console.log('  No torque data — skipping torque chart')
    }

    // 2. Fluid Chart
    const fluidSvg = generateFluidChart(moto.make, moto.model, moto, intervals)
    if (fluidSvg) {
      const filename = `fluids-${slug}.svg`
      const localPath = path.join(LOCAL_DIR, filename)
      fs.writeFileSync(localPath, fluidSvg)
      generated++

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filename, Buffer.from(fluidSvg), { contentType: 'image/svg+xml', upsert: true })
      if (error) {
        console.error(`  Upload failed ${filename}:`, error.message)
      } else {
        const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename)
        console.log(`  Fluid chart -> ${publicUrl}`)
        uploaded++

        const existing = existingDocs.find(
          (d) => d.doc_type === 'fluid_chart' && d.title.includes(moto.model)
        )
        if (existing) {
          await supabase
            .from('technical_documents')
            .update({ file_url: publicUrl, file_type: 'image/svg+xml', source_attribution: 'CrankDoc generated from service manual data' })
            .eq('id', existing.id)
          console.log(`  Updated DB record: ${existing.title}`)
        } else {
          await supabase.from('technical_documents').insert({
            motorcycle_id: moto.motorcycleIds[0],
            title: `${moto.model} Fluid Capacities`,
            doc_type: 'fluid_chart',
            description: `Oil, coolant, fuel, and fluid specifications for the ${moto.make} ${moto.model}.`,
            file_url: publicUrl,
            file_type: 'image/svg+xml',
            source_attribution: 'CrankDoc generated from service manual data',
          })
          console.log(`  Created DB record: ${moto.model} Fluid Capacities`)
        }
      }
    } else {
      console.log('  No fluid data — skipping fluid chart')
    }

    // 3. Wiring Diagram
    const wiringSvg = generateWiringDiagram(moto.make, moto.model, moto.engine_type, moto.fuel_system)
    if (wiringSvg) {
      const filename = `wiring-${slug}.svg`
      const localPath = path.join(LOCAL_DIR, filename)
      fs.writeFileSync(localPath, wiringSvg)
      generated++

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filename, Buffer.from(wiringSvg), { contentType: 'image/svg+xml', upsert: true })
      if (error) {
        console.error(`  Upload failed ${filename}:`, error.message)
      } else {
        const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename)
        console.log(`  Wiring diagram -> ${publicUrl}`)
        uploaded++

        const existing = existingDocs.find(
          (d) => d.doc_type === 'wiring_diagram' && d.title.includes(moto.model)
        )
        if (existing) {
          await supabase
            .from('technical_documents')
            .update({ file_url: publicUrl, file_type: 'image/svg+xml', source_attribution: 'CrankDoc simplified overview diagram' })
            .eq('id', existing.id)
          console.log(`  Updated DB record: ${existing.title}`)
        } else {
          await supabase.from('technical_documents').insert({
            motorcycle_id: moto.motorcycleIds[0],
            title: `${moto.model} Wiring Diagram`,
            doc_type: 'wiring_diagram',
            description: `Simplified electrical system block diagram for the ${moto.make} ${moto.model}.`,
            file_url: publicUrl,
            file_type: 'image/svg+xml',
            source_attribution: 'CrankDoc simplified overview diagram',
          })
          console.log(`  Created DB record: ${moto.model} Wiring Diagram`)
        }
      }
    }
  }

  console.log(`\n=== Summary ===`)
  console.log(`SVGs generated: ${generated}`)
  console.log(`Uploaded to Storage: ${uploaded}`)

  const { count } = await supabase
    .from('technical_documents')
    .select('*', { count: 'exact', head: true })
  console.log(`Total technical_documents rows: ${count}`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
