#!/usr/bin/env npx tsx

/**
 * CrankDoc Existing Data Embedding Script
 *
 * Embeds CrankDoc's existing database content (diagnostic trees, DTC codes,
 * glossary terms, motorcycle specs) into the document_chunks table for
 * RAG search. This makes semantic search work even before any manuals
 * are ingested.
 *
 * Usage:
 *   npx tsx scripts/embed-existing-data.ts
 *   npx tsx scripts/embed-existing-data.ts --type trees
 *   npx tsx scripts/embed-existing-data.ts --type dtc
 *   npx tsx scripts/embed-existing-data.ts --type glossary
 *   npx tsx scripts/embed-existing-data.ts --type specs
 */

import path from 'path'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

if (!OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const BATCH_SIZE = 50
const DATA_SOURCE_TITLE = 'CrankDoc Existing Database'

type DataType = 'trees' | 'dtc' | 'glossary' | 'specs'
const ALL_TYPES: DataType[] = ['trees', 'dtc', 'glossary', 'specs']

function parseArgs(): DataType[] {
  const args = process.argv.slice(2)

  if (args.length === 0) return ALL_TYPES

  const parsed: Record<string, string> = {}
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '')
    parsed[key] = args[i + 1] || ''
  }

  const type = parsed.type as DataType
  if (!ALL_TYPES.includes(type)) {
    console.error(`Invalid type: ${type}. Must be one of: ${ALL_TYPES.join(', ')}`)
    process.exit(1)
  }

  return [type]
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function getOrCreateDocumentSource(): Promise<string> {
  // Check if we already have a source for existing data
  const { data: existing } = await supabase
    .from('document_sources')
    .select('id')
    .eq('title', DATA_SOURCE_TITLE)
    .eq('source_type', 'manual_entry')
    .limit(1)

  if (existing && existing.length > 0) {
    return existing[0].id
  }

  const { data: created, error } = await supabase
    .from('document_sources')
    .insert({
      title: DATA_SOURCE_TITLE,
      source_type: 'manual_entry',
      processing_status: 'processing',
      total_pages: 0,
    })
    .select('id')
    .single()

  if (error || !created) {
    console.error('Failed to create document source:', error?.message)
    process.exit(1)
  }

  return created.id
}

async function embedAndStore(
  texts: string[],
  metadata: Array<{
    contentType: string
    sectionTitle: string | null
    make: string | null
    model: string | null
  }>,
  documentSourceId: string,
  startIndex: number
): Promise<{ stored: number; tokens: number }> {
  const { generateBatchEmbeddings, createOpenAIClient } = await import('../src/lib/rag/embeddings')
  const openai = createOpenAIClient()

  let totalStored = 0
  let totalTokens = 0

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batchTexts = texts.slice(i, i + BATCH_SIZE)
    const batchMeta = metadata.slice(i, i + BATCH_SIZE)

    try {
      const result = await generateBatchEmbeddings(batchTexts, openai)
      totalTokens += result.totalTokens

      const rows = batchTexts.map((text, idx) => ({
        document_source_id: documentSourceId,
        chunk_index: startIndex + i + idx,
        content: text,
        content_length: text.length,
        embedding: JSON.stringify(result.embeddings[idx]),
        make: batchMeta[idx].make,
        model: batchMeta[idx].model,
        section_title: batchMeta[idx].sectionTitle,
        section_hierarchy: [] as string[],
        page_numbers: [] as number[],
        content_type: batchMeta[idx].contentType,
      }))

      const { error } = await supabase.from('document_chunks').insert(rows)

      if (error) {
        console.error(`    Batch insert failed: ${error.message}`)
      } else {
        totalStored += rows.length
      }
    } catch (err) {
      console.error(`    Embedding batch failed: ${err instanceof Error ? err.message : err}`)
    }

    // Rate limit pause
    if (i + BATCH_SIZE < texts.length) {
      await sleep(200)
    }
  }

  return { stored: totalStored, tokens: totalTokens }
}

async function embedDiagnosticTrees(documentSourceId: string): Promise<{ stored: number; tokens: number }> {
  console.log('\n  Embedding diagnostic trees...')

  const { data: trees, error } = await supabase
    .from('diagnostic_trees')
    .select('id, title, description, category, tree_data, motorcycle_id')

  if (error || !trees) {
    console.error(`    Failed to fetch trees: ${error?.message}`)
    return { stored: 0, tokens: 0 }
  }

  console.log(`    Found ${trees.length} trees`)

  // Build text content from each tree: title + description + node texts
  const texts: string[] = []
  const metadata: Array<{ contentType: string; sectionTitle: string | null; make: string | null; model: string | null }> = []

  for (const tree of trees) {
    const treeData = tree.tree_data as { nodes?: Array<{ text?: string; type?: string }> }
    const nodeTexts = treeData.nodes
      ? treeData.nodes.map((n) => n.text || '').filter(Boolean).join('\n')
      : ''

    const text = [
      `Diagnostic Tree: ${tree.title}`,
      tree.description ? `Description: ${tree.description}` : '',
      tree.category ? `Category: ${tree.category}` : '',
      nodeTexts,
    ].filter(Boolean).join('\n')

    texts.push(text)
    metadata.push({
      contentType: 'procedure',
      sectionTitle: tree.title,
      make: null,
      model: null,
    })
  }

  return embedAndStore(texts, metadata, documentSourceId, 0)
}

async function embedDtcCodes(documentSourceId: string): Promise<{ stored: number; tokens: number }> {
  console.log('\n  Embedding DTC codes...')

  const { data: codes, error } = await supabase
    .from('dtc_codes')
    .select('code, description, category, common_causes, manufacturer, system, diagnostic_method')

  if (error || !codes) {
    console.error(`    Failed to fetch DTC codes: ${error?.message}`)
    return { stored: 0, tokens: 0 }
  }

  console.log(`    Found ${codes.length} DTC codes`)

  const texts: string[] = []
  const metadata: Array<{ contentType: string; sectionTitle: string | null; make: string | null; model: string | null }> = []

  for (const code of codes) {
    const parts = [
      `DTC Code: ${code.code}`,
      `Description: ${code.description}`,
      code.category ? `Category: ${code.category}` : '',
      code.system ? `System: ${code.system}` : '',
      code.manufacturer ? `Manufacturer: ${code.manufacturer}` : '',
      code.common_causes ? `Common causes: ${code.common_causes.join(', ')}` : '',
      code.diagnostic_method ? `Diagnostic method: ${code.diagnostic_method}` : '',
    ].filter(Boolean)

    texts.push(parts.join('\n'))
    metadata.push({
      contentType: 'prose',
      sectionTitle: `DTC ${code.code}`,
      make: code.manufacturer,
      model: null,
    })
  }

  return embedAndStore(texts, metadata, documentSourceId, 10000)
}

async function embedGlossaryTerms(documentSourceId: string): Promise<{ stored: number; tokens: number }> {
  console.log('\n  Embedding glossary terms...')

  const { data: terms, error } = await supabase
    .from('glossary_terms')
    .select('term, definition, category, aliases')

  if (error || !terms) {
    console.error(`    Failed to fetch glossary terms: ${error?.message}`)
    return { stored: 0, tokens: 0 }
  }

  console.log(`    Found ${terms.length} glossary terms`)

  const texts: string[] = []
  const metadata: Array<{ contentType: string; sectionTitle: string | null; make: string | null; model: string | null }> = []

  for (const term of terms) {
    const parts = [
      `Term: ${term.term}`,
      `Definition: ${term.definition}`,
      term.category ? `Category: ${term.category}` : '',
      term.aliases && term.aliases.length > 0 ? `Also known as: ${term.aliases.join(', ')}` : '',
    ].filter(Boolean)

    texts.push(parts.join('\n'))
    metadata.push({
      contentType: 'prose',
      sectionTitle: term.term,
      make: null,
      model: null,
    })
  }

  return embedAndStore(texts, metadata, documentSourceId, 20000)
}

async function embedMotorcycleSpecs(documentSourceId: string): Promise<{ stored: number; tokens: number }> {
  console.log('\n  Embedding motorcycle specs...')

  const { data: bikes, error } = await supabase
    .from('motorcycles')
    .select('*')

  if (error || !bikes) {
    console.error(`    Failed to fetch motorcycles: ${error?.message}`)
    return { stored: 0, tokens: 0 }
  }

  console.log(`    Found ${bikes.length} motorcycles`)

  const texts: string[] = []
  const metadata: Array<{ contentType: string; sectionTitle: string | null; make: string | null; model: string | null }> = []

  for (const bike of bikes) {
    const specs = [
      `${bike.make} ${bike.model} (${bike.year_start}-${bike.year_end || 'present'})`,
      bike.engine_type ? `Engine: ${bike.engine_type}` : '',
      bike.displacement_cc ? `Displacement: ${bike.displacement_cc}cc` : '',
      bike.horsepower ? `Horsepower: ${bike.horsepower} HP` : '',
      bike.torque_nm ? `Torque: ${bike.torque_nm} Nm` : '',
      bike.oil_capacity_liters ? `Oil capacity: ${bike.oil_capacity_liters}L` : '',
      bike.coolant_capacity_liters ? `Coolant capacity: ${bike.coolant_capacity_liters}L` : '',
      bike.valve_clearance_intake ? `Valve clearance intake: ${bike.valve_clearance_intake}` : '',
      bike.valve_clearance_exhaust ? `Valve clearance exhaust: ${bike.valve_clearance_exhaust}` : '',
      bike.spark_plug ? `Spark plug: ${bike.spark_plug}` : '',
      bike.tire_front ? `Front tire: ${bike.tire_front}` : '',
      bike.tire_rear ? `Rear tire: ${bike.tire_rear}` : '',
      bike.fuel_capacity_liters ? `Fuel capacity: ${bike.fuel_capacity_liters}L` : '',
      bike.dry_weight_kg ? `Dry weight: ${bike.dry_weight_kg}kg` : '',
    ].filter(Boolean)

    texts.push(specs.join('\n'))
    metadata.push({
      contentType: 'spec_table',
      sectionTitle: `${bike.make} ${bike.model} Specifications`,
      make: bike.make,
      model: bike.model,
    })
  }

  return embedAndStore(texts, metadata, documentSourceId, 30000)
}

async function main() {
  const types = parseArgs()

  console.log('\nCrankDoc Existing Data Embedding')
  console.log('=================================\n')
  console.log(`  Types to embed: ${types.join(', ')}`)

  const documentSourceId = await getOrCreateDocumentSource()
  console.log(`  Document source ID: ${documentSourceId}`)

  let totalStored = 0
  let totalTokens = 0

  const handlers: Record<DataType, (id: string) => Promise<{ stored: number; tokens: number }>> = {
    trees: embedDiagnosticTrees,
    dtc: embedDtcCodes,
    glossary: embedGlossaryTerms,
    specs: embedMotorcycleSpecs,
  }

  for (const type of types) {
    const result = await handlers[type](documentSourceId)
    totalStored += result.stored
    totalTokens += result.tokens
    console.log(`    Stored: ${result.stored}, Tokens: ${result.tokens}`)
  }

  // Update document source status
  await supabase
    .from('document_sources')
    .update({
      processing_status: 'completed',
      processed_at: new Date().toISOString(),
    })
    .eq('id', documentSourceId)

  console.log('\n=================================')
  console.log(`Done: ${totalStored} chunks embedded`)
  console.log(`Total tokens: ${totalTokens}`)
  console.log(`Estimated cost: $${((totalTokens / 1_000_000) * 0.02).toFixed(6)}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
