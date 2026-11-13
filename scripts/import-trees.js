#!/usr/bin/env node

/**
 * CrankDoc Tree Import Script
 *
 * Reads diagnostic tree JSON files from data/trees/ and inserts them into Supabase.
 * Each JSON file represents one diagnostic tree.
 *
 * Usage:
 *   node scripts/import-trees.js                                # every guide
 *   node scripts/import-trees.js yamaha-mt07-wont-start.json    # only the named guides
 *
 * A guide that is already in the database (same title, same bike) is updated
 * in place and keeps its id. New guides are inserted.
 *
 * JSON file format:
 * {
 *   "motorcycle_make": "Honda",        // optional — if set, links to motorcycle
 *   "motorcycle_model": "CBR600RR",    // optional — required if make is set
 *   "title": "Engine Won't Start",
 *   "description": "...",
 *   "category": "electrical",
 *   "difficulty": "beginner",          // beginner | intermediate | advanced
 *   "tree_data": { "nodes": [...] }
 * }
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const { selectTreeFiles, findExistingTree } = require('./lib/treeImport')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const TREES_DIR = path.join(__dirname, '..', 'data', 'trees')

/** Ids of every row for this bike (a model can have several generation rows), oldest first. */
async function getMotorcycleIds(make, model, generation) {
  let query = supabase
    .from('motorcycles')
    .select('id')
    .eq('make', make)
    .eq('model', model)

  if (generation) {
    query = query.eq('generation', generation)
  }

  const { data, error } = await query.order('year_start', { ascending: true })

  if (error || !data) return []
  return data.map((row) => row.id)
}

async function importTree(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const tree = JSON.parse(raw)
  const fileName = path.basename(filePath)

  // Validate required fields
  if (!tree.title || !tree.tree_data || !tree.tree_data.nodes) {
    console.error(`  SKIP ${fileName}: missing title or tree_data.nodes`)
    return false
  }

  // Look up motorcycle if specified
  let motorcycleIds = []
  if (tree.motorcycle_make && tree.motorcycle_model) {
    motorcycleIds = await getMotorcycleIds(tree.motorcycle_make, tree.motorcycle_model, tree.motorcycle_generation)
    if (motorcycleIds.length === 0) {
      // Never fall back to a universal guide: a model-specific guide would then show for every bike
      const genLabel = tree.motorcycle_generation ? ` [${tree.motorcycle_generation}]` : ''
      console.error(`  FAIL ${fileName}: motorcycle ${tree.motorcycle_make} ${tree.motorcycle_model}${genLabel} is not in the database`)
      return false
    }
  }
  const motorcycleId = motorcycleIds.length > 0 ? motorcycleIds[0] : null

  // Check for existing tree with same title and motorcycle
  let existing
  try {
    existing = await findExistingTree(supabase, tree.title, motorcycleIds)
  } catch (err) {
    console.error(`  FAIL ${fileName}: ${err.message}`)
    return false
  }

  if (existing) {
    // Update existing tree
    const { error } = await supabase
      .from('diagnostic_trees')
      .update({
        description: tree.description || null,
        category: tree.category || null,
        difficulty: tree.difficulty || null,
        tree_data: tree.tree_data,
      })
      .eq('id', existing.id)

    if (error) {
      console.error(`  FAIL ${fileName}: ${error.message}`)
      return false
    }
    console.log(`  UPDATE ${fileName} -> "${tree.title}"`)
    return true
  }

  // Insert new tree
  const { error } = await supabase.from('diagnostic_trees').insert({
    motorcycle_id: motorcycleId,
    title: tree.title,
    description: tree.description || null,
    category: tree.category || null,
    difficulty: tree.difficulty || null,
    tree_data: tree.tree_data,
  })

  if (error) {
    console.error(`  FAIL ${fileName}: ${error.message}`)
    return false
  }

  console.log(`  INSERT ${fileName} -> "${tree.title}"${motorcycleId ? ` (${tree.motorcycle_make} ${tree.motorcycle_model})` : ' (universal)'}`)
  return true
}

async function main() {
  console.log('\nCrankDoc Tree Import')
  console.log('====================\n')

  if (!fs.existsSync(TREES_DIR)) {
    console.error(`Directory not found: ${TREES_DIR}`)
    process.exit(1)
  }

  const allFiles = fs.readdirSync(TREES_DIR).filter((f) => f.endsWith('.json')).sort()

  if (allFiles.length === 0) {
    console.log('No JSON files found in data/trees/')
    process.exit(0)
  }

  // Optional file names on the command line limit the import to those guides
  const { files, unknown } = selectTreeFiles(allFiles, process.argv.slice(2))
  if (unknown.length > 0) {
    console.error(`No such file in data/trees/: ${unknown.join(', ')}`)
    process.exit(1)
  }

  console.log(`Importing ${files.length} of ${allFiles.length} tree files\n`)

  let success = 0
  let failed = 0

  for (const file of files) {
    const ok = await importTree(path.join(TREES_DIR, file))
    if (ok) success++
    else failed++
  }

  console.log(`\nDone: ${success} imported, ${failed} failed`)

  // Count total trees in DB
  const { count } = await supabase
    .from('diagnostic_trees')
    .select('*', { count: 'exact', head: true })

  console.log(`Total trees in database: ${count}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
