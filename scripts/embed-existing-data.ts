#!/usr/bin/env npx tsx

/**
 * Embed Existing Database Content
 *
 * Reads diagnostic trees, DTC codes, glossary terms, and motorcycle
 * specs from Supabase and embeds them into the vector database for
 * RAG search.
 *
 * Usage:
 *   npx tsx scripts/embed-existing-data.ts
 *   npx tsx scripts/embed-existing-data.ts --dry-run
 *   npx tsx scripts/embed-existing-data.ts --force
 *   npx tsx scripts/embed-existing-data.ts --verbose
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

const EMBED_BATCH_SIZE = 50

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

interface CliArgs {
  dryRun: boolean
  force: boolean
  verbose: boolean
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2)
  const parsed: CliArgs = {
    dryRun: false,
    force: false,
    verbose: false,
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--dry-run':
        parsed.dryRun = true
        break
      case '--force':
        parsed.force = true
        break
      case '--verbose':
        parsed.verbose = true
        break
      default:
        console.error(`Unknown flag: ${args[i]}`)
        console.error(
          'Usage: npx tsx scripts/embed-existing-data.ts [--dry-run] [--force] [--verbose]'
        )
        process.exit(1)
    }
  }

  return parsed
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Types for Supabase query results
// ---------------------------------------------------------------------------

interface DiagnosticTree {
  id: string
  title: string
  description: string | null
  category: string | null
  difficulty: string | null
  motorcycle_id: string | null
  tree_data: {
    nodes: Array<{
      id: string
      type: string
      text: string
      safety?: string
      instructions?: string
      warning?: string
      options?: Array<{ text: string; next: string }>
    }>
  } | null
}

interface DtcCode {
  id: string
  code: string
  description: string | null
  category: string | null
  manufacturer: string | null
  common_causes: string[] | null
  severity: string | null
  system: string | null
  diagnostic_method: string | null
  fix_reference: string | null
}

interface GlossaryTerm {
  id: string
  term: string
  definition: string | null
  category: string | null
}

interface Motorcycle {
  id: string
  make: string
  model: string
  year_start: number | null
  year_end: number | null
  category: string | null
}

interface ServiceInterval {
  id: string
  motorcycle_id: string
  service_name: string
  interval_miles: number | null
  interval_km: number | null
  interval_months: number | null
  description: string | null
  torque_spec: string | null
  fluid_spec: string | null
}

// ---------------------------------------------------------------------------
// Text builders — create human-readable text from DB records
// ---------------------------------------------------------------------------

function buildTreeText(tree: DiagnosticTree): string {
  const parts: string[] = []

  parts.push(tree.title)

  if (tree.description) {
    parts.push(tree.description)
  }

  if (tree.category) {
    parts.push(`Category: ${tree.category}`)
  }

  if (tree.difficulty) {
    parts.push(`Difficulty: ${tree.difficulty}`)
  }

  if (tree.tree_data?.nodes) {
    const nodeTexts: string[] = []
    for (const node of tree.tree_data.nodes) {
      let nodeText = `${node.type}: ${node.text}`

      if (node.instructions) {
        nodeText += `\n${node.instructions}`
      }

      if (node.warning) {
        nodeText += `\nWARNING: ${node.warning}`
      }

      if (node.options) {
        for (const opt of node.options) {
          nodeText += `\n- ${opt.text}`
        }
      }

      nodeTexts.push(nodeText)
    }

    parts.push('Diagnostic Steps:')
    parts.push(nodeTexts.join('\n\n'))
  }

  return parts.join('\n\n')
}

function buildDtcText(dtc: DtcCode): string {
  const parts: string[] = []

  parts.push(`DTC ${dtc.code}: ${dtc.description || 'No description'}`)

  if (dtc.manufacturer) {
    parts.push(`Manufacturer: ${dtc.manufacturer}`)
  }

  if (dtc.category) {
    parts.push(`Category: ${dtc.category}`)
  }

  if (dtc.severity) {
    parts.push(`Severity: ${dtc.severity}`)
  }

  if (dtc.system) {
    parts.push(`System: ${dtc.system}`)
  }

  if (dtc.common_causes && dtc.common_causes.length > 0) {
    parts.push(
      `Possible Causes:\n${dtc.common_causes.map((c) => `- ${c}`).join('\n')}`
    )
  }

  if (dtc.diagnostic_method) {
    parts.push(`Diagnostic Method: ${dtc.diagnostic_method}`)
  }

  if (dtc.fix_reference) {
    parts.push(`Fix Reference: ${dtc.fix_reference}`)
  }

  return parts.join('\n\n')
}

function buildGlossaryText(term: GlossaryTerm): string {
  const parts: string[] = []

  parts.push(`${term.term}: ${term.definition || 'No definition'}`)

  if (term.category) {
    parts.push(`Category: ${term.category}`)
  }

  return parts.join('\n\n')
}

function buildMotorcycleText(
  moto: Motorcycle,
  intervals: ServiceInterval[]
): string {
  const parts: string[] = []

  const yearRange = moto.year_end
    ? `${moto.year_start}-${moto.year_end}`
    : moto.year_start
      ? `${moto.year_start}`
      : 'Unknown year'

  parts.push(`${moto.make} ${moto.model} (${yearRange})`)

  if (moto.category) {
    parts.push(`Category: ${moto.category}`)
  }

  if (intervals.length > 0) {
    const intervalTexts = intervals.map((i) => {
      const lineParts = [i.service_name]

      if (i.interval_km) {
        lineParts.push(`Every ${i.interval_km} km`)
      }
      if (i.interval_miles) {
        lineParts.push(`/ ${i.interval_miles} miles`)
      }
      if (i.interval_months) {
        lineParts.push(`/ ${i.interval_months} months`)
      }
      if (i.description) {
        lineParts.push(`— ${i.description}`)
      }
      if (i.torque_spec) {
        lineParts.push(`Torque: ${i.torque_spec}`)
      }
      if (i.fluid_spec) {
        lineParts.push(`Fluid: ${i.fluid_spec}`)
      }

      return lineParts.join(' ')
    })

    parts.push(`Service Intervals:\n${intervalTexts.join('\n')}`)
  }

  return parts.join('\n\n')
}

// ---------------------------------------------------------------------------
// Dedup check helper
// ---------------------------------------------------------------------------

async function sourceExists(filePath: string): Promise<boolean> {
  const { data } = await supabase
    .from('document_sources')
    .select('id')
    .eq('source_type', 'database')
    .eq('file_path', filePath)
    .limit(1)

  return !!(data && data.length > 0)
}

// ---------------------------------------------------------------------------
// Chunking + embedding + storage pipeline for one content item
// ---------------------------------------------------------------------------

interface ChunkFn {
  (
    pages: Array<{ pageNumber: number; text: string; isScanned: boolean }>,
    metadata: {
      make: string
      model: string
      yearStart: number
      yearEnd: number | null
      manualType: string
    }
  ): Array<{
    content: string
    chunkIndex: number
    contentType: string
    sectionTitle: string | null
    sectionHierarchy: string[]
    pageNumbers: number[]
    contentLength: number
  }>
}

interface GenBatchFn {
  (
    texts: string[],
    client: import('openai').default
  ): Promise<{ embeddings: number[][]; totalTokens: number }>
}

interface EmbedItemParams {
  title: string
  filePath: string
  text: string
  contentTypeOverride: string | null
  make: string | null
  model: string | null
  yearStart: number | null
  yearEnd: number | null
  motorcycleId: string | null
  args: CliArgs
  chunkDocument: ChunkFn
  generateBatchEmbeddings: GenBatchFn
  openai: import('openai').default | null
}

interface EmbedItemResult {
  chunks: number
  tokens: number
  cost: number
  skipped: boolean
}

async function embedItem(params: EmbedItemParams): Promise<EmbedItemResult> {
  const {
    title,
    filePath,
    text,
    contentTypeOverride,
    make,
    model,
    yearStart,
    yearEnd,
    motorcycleId,
    args,
    chunkDocument,
    generateBatchEmbeddings: genBatchEmbed,
    openai,
  } = params

  // Dedup check
  if (!args.force) {
    const exists = await sourceExists(filePath)
    if (exists) {
      if (args.verbose) {
        console.log(`    SKIP: already embedded (${filePath})`)
      }
      return { chunks: 0, tokens: 0, cost: 0, skipped: true }
    }
  }

  // Build pages array for the chunker
  const pages = [{ pageNumber: 1, text, isScanned: false }]

  // Chunk the text
  const chunks = chunkDocument(pages, {
    make: make || 'Universal',
    model: model || 'All Models',
    yearStart: yearStart || 0,
    yearEnd: yearEnd,
    manualType: 'database',
  })

  if (chunks.length === 0) {
    if (args.verbose) {
      console.log(`    SKIP: no chunks produced for "${title}"`)
    }
    return { chunks: 0, tokens: 0, cost: 0, skipped: true }
  }

  if (args.dryRun) {
    if (args.verbose) {
      console.log(`    [DRY RUN] "${title}" -> ${chunks.length} chunks`)
      for (const chunk of chunks.slice(0, 2)) {
        console.log(
          `      Chunk ${chunk.chunkIndex} (${chunk.contentType}): ${chunk.content.substring(0, 120)}...`
        )
      }
    }
    // Estimate tokens: ~1 token per 4 chars
    const estimatedTokens = Math.ceil(text.length / 4)
    return {
      chunks: chunks.length,
      tokens: estimatedTokens,
      cost: (estimatedTokens / 1_000_000) * 0.02,
      skipped: false,
    }
  }

  // Generate embeddings
  const chunkTexts = chunks.map((c) => c.content)
  let allEmbeddings: number[][] = []
  let totalTokens = 0

  for (let i = 0; i < chunkTexts.length; i += EMBED_BATCH_SIZE) {
    const batch = chunkTexts.slice(i, i + EMBED_BATCH_SIZE)

    const result = await genBatchEmbed(batch, openai!)
    allEmbeddings = allEmbeddings.concat(result.embeddings)
    totalTokens += result.totalTokens

    if (i + EMBED_BATCH_SIZE < chunkTexts.length) {
      await sleep(200)
    }
  }

  const cost = (totalTokens / 1_000_000) * 0.02

  // Create document_sources record
  const { data: docSource, error: docError } = await supabase
    .from('document_sources')
    .insert({
      title,
      source_type: 'database',
      file_path: filePath,
      file_hash: null,
      make,
      model,
      year_start: yearStart,
      year_end: yearEnd,
      manual_type: null,
      total_pages: 1,
      processing_status: 'processing',
    })
    .select('id')
    .single()

  if (docError || !docSource) {
    console.error(
      `    FAILED to create document source: ${docError?.message}`
    )
    return { chunks: 0, tokens: totalTokens, cost, skipped: false }
  }

  // Insert chunks
  let insertedCount = 0
  let failedCount = 0

  for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
    const batch = chunks
      .slice(i, i + EMBED_BATCH_SIZE)
      .map((chunk, idx) => ({
        document_source_id: docSource.id,
        chunk_index: i + idx,
        content: chunk.content,
        content_length: chunk.contentLength,
        embedding: JSON.stringify(allEmbeddings[i + idx]),
        motorcycle_id: motorcycleId,
        make,
        model,
        section_title: chunk.sectionTitle,
        section_hierarchy: chunk.sectionHierarchy,
        page_numbers: chunk.pageNumbers,
        content_type: contentTypeOverride || chunk.contentType,
      }))

    const { error } = await supabase.from('document_chunks').insert(batch)

    if (error) {
      console.error(`    Batch insert failed: ${error.message}`)
      failedCount += batch.length
    } else {
      insertedCount += batch.length
    }
  }

  // Update document source status
  const finalStatus = failedCount === 0 ? 'completed' : 'failed'
  await supabase
    .from('document_sources')
    .update({
      processing_status: finalStatus,
      processed_at: new Date().toISOString(),
      processing_error:
        failedCount > 0
          ? `${failedCount} chunks failed to insert`
          : null,
    })
    .eq('id', docSource.id)

  return { chunks: insertedCount, tokens: totalTokens, cost, skipped: false }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs()

  console.log('\nCrankDoc Database Content Embedder')
  console.log('===================================\n')
  console.log(`  Force:   ${args.force}`)
  console.log(`  Dry run: ${args.dryRun}`)
  console.log(`  Verbose: ${args.verbose}`)

  // Dynamic imports (same pattern as scrape-bike-specs.ts)
  const { chunkDocument } = await import('../src/lib/rag/chunker')
  const { generateBatchEmbeddings, createOpenAIClient } = await import(
    '../src/lib/rag/embeddings'
  )

  const openai = args.dryRun ? null : createOpenAIClient()

  let totalChunks = 0
  let totalTokens = 0
  let totalCost = 0
  let totalSkipped = 0
  let totalFailed = 0

  // =========================================================================
  // 1. Diagnostic Trees
  // =========================================================================
  console.log('\n--- Diagnostic Trees ---')

  const { data: trees, error: treesError } = await supabase
    .from('diagnostic_trees')
    .select(
      'id, title, description, category, difficulty, motorcycle_id, tree_data'
    )

  if (treesError) {
    console.error(
      `  FAILED to query diagnostic_trees: ${treesError.message}`
    )
    totalFailed++
  } else if (!trees || trees.length === 0) {
    console.log('  No diagnostic trees found')
  } else {
    console.log(`  Found ${trees.length} diagnostic trees`)

    // Cache motorcycle lookups to avoid repeated queries
    const motorcycleCache = new Map<string, Motorcycle>()
    let sectionSkipped = 0

    for (let i = 0; i < trees.length; i++) {
      const tree = trees[i] as DiagnosticTree

      let make: string | null = null
      let model: string | null = null
      let yearStart: number | null = null
      let yearEnd: number | null = null
      const motorcycleId: string | null = tree.motorcycle_id

      if (motorcycleId) {
        if (!motorcycleCache.has(motorcycleId)) {
          const { data: moto } = await supabase
            .from('motorcycles')
            .select('id, make, model, year_start, year_end, category')
            .eq('id', motorcycleId)
            .limit(1)
            .single()

          if (moto) {
            motorcycleCache.set(motorcycleId, moto as Motorcycle)
          }
        }

        const moto = motorcycleCache.get(motorcycleId)
        if (moto) {
          make = moto.make
          model = moto.model
          yearStart = moto.year_start
          yearEnd = moto.year_end
        }
      }

      const text = buildTreeText(tree)
      const filePath = `diagnostic_tree:${tree.id}`

      if (args.verbose) {
        console.log(
          `  [${i + 1}/${trees.length}] ${tree.title} (${text.length} chars)`
        )
      }

      try {
        const result = await embedItem({
          title: `Diagnostic: ${tree.title}`,
          filePath,
          text,
          contentTypeOverride: null, // let chunker detect
          make,
          model,
          yearStart,
          yearEnd,
          motorcycleId,
          args,
          chunkDocument,
          generateBatchEmbeddings,
          openai,
        })

        if (result.skipped) {
          totalSkipped++
          sectionSkipped++
        } else {
          totalChunks += result.chunks
          totalTokens += result.tokens
          totalCost += result.cost
        }
      } catch (error) {
        console.error(
          `    FAILED: ${error instanceof Error ? error.message : String(error)}`
        )
        totalFailed++
      }

      // Rate limit between items when actually embedding
      if (!args.dryRun && i < trees.length - 1) {
        await sleep(100)
      }
    }

    console.log(
      `  Trees done: ${trees.length} total, ${sectionSkipped} skipped`
    )
  }

  // =========================================================================
  // 2. DTC Codes (grouped by manufacturer)
  // =========================================================================
  console.log('\n--- DTC Codes ---')

  const { data: dtcCodes, error: dtcError } = await supabase
    .from('dtc_codes')
    .select(
      'id, code, description, category, manufacturer, common_causes, severity, system, diagnostic_method, fix_reference'
    )

  if (dtcError) {
    console.error(`  FAILED to query dtc_codes: ${dtcError.message}`)
    totalFailed++
  } else if (!dtcCodes || dtcCodes.length === 0) {
    console.log('  No DTC codes found')
  } else {
    console.log(`  Found ${dtcCodes.length} DTC codes`)

    // Group by manufacturer for more meaningful chunking
    const byManufacturer = new Map<string, DtcCode[]>()

    for (const dtc of dtcCodes as DtcCode[]) {
      const mfr = dtc.manufacturer || 'Universal'
      if (!byManufacturer.has(mfr)) {
        byManufacturer.set(mfr, [])
      }
      byManufacturer.get(mfr)!.push(dtc)
    }

    let dtcGroupIndex = 0
    const dtcGroupTotal = byManufacturer.size
    let sectionSkipped = 0

    for (const [manufacturer, codes] of byManufacturer) {
      dtcGroupIndex++

      const text = codes
        .map((dtc) => buildDtcText(dtc))
        .join('\n\n---\n\n')
      const filePath = `dtc_codes:${manufacturer.toLowerCase().replace(/\s+/g, '-')}`

      if (args.verbose) {
        console.log(
          `  [${dtcGroupIndex}/${dtcGroupTotal}] ${manufacturer}: ${codes.length} codes (${text.length} chars)`
        )
      }

      try {
        const result = await embedItem({
          title: `DTC Codes: ${manufacturer}`,
          filePath,
          text,
          contentTypeOverride: 'spec_table',
          make: manufacturer === 'Universal' ? null : manufacturer,
          model: null,
          yearStart: null,
          yearEnd: null,
          motorcycleId: null,
          args,
          chunkDocument,
          generateBatchEmbeddings,
          openai,
        })

        if (result.skipped) {
          totalSkipped++
          sectionSkipped++
        } else {
          totalChunks += result.chunks
          totalTokens += result.tokens
          totalCost += result.cost
        }
      } catch (error) {
        console.error(
          `    FAILED: ${error instanceof Error ? error.message : String(error)}`
        )
        totalFailed++
      }

      if (!args.dryRun && dtcGroupIndex < dtcGroupTotal) {
        await sleep(100)
      }
    }

    console.log(
      `  DTC groups done: ${dtcGroupTotal} total, ${sectionSkipped} skipped`
    )
  }

  // =========================================================================
  // 3. Glossary Terms (grouped by category)
  // =========================================================================
  console.log('\n--- Glossary Terms ---')

  const { data: glossaryTerms, error: glossaryError } = await supabase
    .from('glossary_terms')
    .select('id, term, definition, category')

  if (glossaryError) {
    console.error(
      `  FAILED to query glossary_terms: ${glossaryError.message}`
    )
    totalFailed++
  } else if (!glossaryTerms || glossaryTerms.length === 0) {
    console.log('  No glossary terms found')
  } else {
    console.log(`  Found ${glossaryTerms.length} glossary terms`)

    // Group by category for meaningful chunking
    const byCategory = new Map<string, GlossaryTerm[]>()

    for (const term of glossaryTerms as GlossaryTerm[]) {
      const cat = term.category || 'General'
      if (!byCategory.has(cat)) {
        byCategory.set(cat, [])
      }
      byCategory.get(cat)!.push(term)
    }

    let glossaryGroupIndex = 0
    const glossaryGroupTotal = byCategory.size
    let sectionSkipped = 0

    for (const [category, terms] of byCategory) {
      glossaryGroupIndex++

      const text = terms
        .map((t) => buildGlossaryText(t))
        .join('\n\n---\n\n')
      const filePath = `glossary:${category.toLowerCase().replace(/\s+/g, '-')}`

      if (args.verbose) {
        console.log(
          `  [${glossaryGroupIndex}/${glossaryGroupTotal}] ${category}: ${terms.length} terms (${text.length} chars)`
        )
      }

      try {
        const result = await embedItem({
          title: `Glossary: ${category}`,
          filePath,
          text,
          contentTypeOverride: null, // prose
          make: null,
          model: null,
          yearStart: null,
          yearEnd: null,
          motorcycleId: null,
          args,
          chunkDocument,
          generateBatchEmbeddings,
          openai,
        })

        if (result.skipped) {
          totalSkipped++
          sectionSkipped++
        } else {
          totalChunks += result.chunks
          totalTokens += result.tokens
          totalCost += result.cost
        }
      } catch (error) {
        console.error(
          `    FAILED: ${error instanceof Error ? error.message : String(error)}`
        )
        totalFailed++
      }

      if (!args.dryRun && glossaryGroupIndex < glossaryGroupTotal) {
        await sleep(100)
      }
    }

    console.log(
      `  Glossary groups done: ${glossaryGroupTotal} total, ${sectionSkipped} skipped`
    )
  }

  // =========================================================================
  // 4. Motorcycle Specs + Service Intervals
  // =========================================================================
  console.log('\n--- Motorcycle Specs ---')

  const { data: motorcycles, error: motoError } = await supabase
    .from('motorcycles')
    .select('id, make, model, year_start, year_end, category')

  if (motoError) {
    console.error(`  FAILED to query motorcycles: ${motoError.message}`)
    totalFailed++
  } else if (!motorcycles || motorcycles.length === 0) {
    console.log('  No motorcycles found')
  } else {
    console.log(`  Found ${motorcycles.length} motorcycles`)
    let sectionSkipped = 0

    for (let i = 0; i < motorcycles.length; i++) {
      const moto = motorcycles[i] as Motorcycle

      // Fetch service intervals for this motorcycle
      const { data: intervals } = await supabase
        .from('service_intervals')
        .select(
          'id, motorcycle_id, service_name, interval_miles, interval_km, interval_months, description, torque_spec, fluid_spec'
        )
        .eq('motorcycle_id', moto.id)

      const serviceIntervals = (intervals || []) as ServiceInterval[]
      const text = buildMotorcycleText(moto, serviceIntervals)
      const filePath = `motorcycle:${moto.id}`

      if (args.verbose) {
        console.log(
          `  [${i + 1}/${motorcycles.length}] ${moto.make} ${moto.model} — ${serviceIntervals.length} intervals (${text.length} chars)`
        )
      }

      try {
        const result = await embedItem({
          title: `${moto.make} ${moto.model} Specs`,
          filePath,
          text,
          contentTypeOverride: 'spec_table',
          make: moto.make,
          model: moto.model,
          yearStart: moto.year_start,
          yearEnd: moto.year_end,
          motorcycleId: moto.id,
          args,
          chunkDocument,
          generateBatchEmbeddings,
          openai,
        })

        if (result.skipped) {
          totalSkipped++
          sectionSkipped++
        } else {
          totalChunks += result.chunks
          totalTokens += result.tokens
          totalCost += result.cost
        }
      } catch (error) {
        console.error(
          `    FAILED: ${error instanceof Error ? error.message : String(error)}`
        )
        totalFailed++
      }

      if (!args.dryRun && i < motorcycles.length - 1) {
        await sleep(100)
      }
    }

    console.log(
      `  Motorcycles done: ${motorcycles.length} total, ${sectionSkipped} skipped`
    )
  }

  // =========================================================================
  // Summary
  // =========================================================================
  console.log(`\n${'='.repeat(60)}`)
  console.log('SUMMARY')
  console.log('='.repeat(60))
  console.log(`  Total chunks:  ${totalChunks}`)
  console.log(`  Total skipped: ${totalSkipped}`)
  console.log(`  Total failed:  ${totalFailed}`)
  console.log(`  Total tokens:  ${totalTokens}`)
  console.log(`  Total cost:    $${totalCost.toFixed(6)}`)

  if (args.dryRun) {
    console.log('\n  (DRY RUN — no data was written or embedded)')
  }

  console.log()
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
