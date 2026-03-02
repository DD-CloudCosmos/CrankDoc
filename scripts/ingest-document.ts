#!/usr/bin/env npx tsx

/**
 * CrankDoc Document Ingestion Script
 *
 * Ingests a document (PDF or plain text) into the RAG pipeline:
 * 1. Parses the document and extracts text
 * 2. Chunks the text using motorcycle-manual-aware splitting
 * 3. Generates embeddings for each chunk
 * 4. Stores everything in Supabase (document_sources + document_chunks)
 *
 * Usage:
 *   npx tsx scripts/ingest-document.ts --file ./data/manuals/honda-cbr600rr.pdf --make Honda --model CBR600RR --year-start 2003 --year-end 2004 --type service_manual
 *   npx tsx scripts/ingest-document.ts --text "Manual content..." --title "Quick Reference" --make Honda --model CBR600RR --year-start 2003 --type manual_entry
 */

import path from 'path'
import fs from 'fs'
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

interface CliArgs {
  file: string | null
  text: string | null
  title: string | null
  make: string
  model: string
  yearStart: number
  yearEnd: number | null
  type: 'service_manual' | 'owners_manual' | 'parts_catalog' | 'tsb'
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2)
  const parsed: Record<string, string> = {}

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '')
    const value = args[i + 1]
    if (!value) {
      console.error(`Missing value for --${key}`)
      process.exit(1)
    }
    parsed[key] = value
  }

  if (!parsed.make || !parsed.model || !parsed['year-start']) {
    console.error('Required: --make, --model, --year-start')
    console.error('Plus either --file <path> or --text <content>')
    process.exit(1)
  }

  if (!parsed.file && !parsed.text) {
    console.error('Must provide either --file <path> or --text <content>')
    process.exit(1)
  }

  return {
    file: parsed.file || null,
    text: parsed.text || null,
    title: parsed.title || null,
    make: parsed.make,
    model: parsed.model,
    yearStart: parseInt(parsed['year-start'], 10),
    yearEnd: parsed['year-end'] ? parseInt(parsed['year-end'], 10) : null,
    type: (parsed.type as CliArgs['type']) || 'service_manual',
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  const args = parseArgs()

  console.log('\nCrankDoc Document Ingestion')
  console.log('===========================\n')
  console.log(`  Make: ${args.make}`)
  console.log(`  Model: ${args.model}`)
  console.log(`  Years: ${args.yearStart}-${args.yearEnd || 'present'}`)
  console.log(`  Type: ${args.type}`)

  // Dynamically import RAG modules (they use path aliases that tsx resolves)
  const { parsePdf, parseManualEntry, computeFileHash } = await import('../src/lib/rag/documentParser')
  const { chunkDocument } = await import('../src/lib/rag/chunker')
  const { generateBatchEmbeddings, createOpenAIClient } = await import('../src/lib/rag/embeddings')

  const openai = createOpenAIClient()

  // Step 1: Parse document
  console.log('\n[1/5] Parsing document...')

  let parsedDoc
  let fileHash: string | null = null
  let sourceType: 'pdf' | 'scan' | 'manual_entry'

  if (args.file) {
    const filePath = path.resolve(args.file)
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`)
      process.exit(1)
    }

    const buffer = fs.readFileSync(filePath)
    fileHash = await computeFileHash(buffer)
    console.log(`  File: ${filePath}`)
    console.log(`  Hash: ${fileHash.slice(0, 16)}...`)

    // Check for duplicate
    const { data: existing } = await supabase
      .from('document_sources')
      .select('id, title')
      .eq('file_hash', fileHash)
      .limit(1)

    if (existing && existing.length > 0) {
      console.error(`\n  Document already ingested: "${existing[0].title}" (${existing[0].id})`)
      console.error('  Use a different file or delete the existing document first.')
      process.exit(1)
    }

    parsedDoc = await parsePdf(buffer)
    sourceType = parsedDoc.pages.some((p) => p.isScanned) ? 'scan' : 'pdf'
  } else {
    parsedDoc = await parseManualEntry(args.text!, args.title || `${args.make} ${args.model} Manual Entry`)
    sourceType = 'manual_entry'
  }

  console.log(`  Pages: ${parsedDoc.totalPages}`)
  console.log(`  Source type: ${sourceType}`)

  // Step 2: Create document_sources record
  console.log('\n[2/5] Creating document source record...')

  const { data: docSource, error: docError } = await supabase
    .from('document_sources')
    .insert({
      title: parsedDoc.title,
      source_type: sourceType,
      file_path: args.file || null,
      file_hash: fileHash,
      make: args.make,
      model: args.model,
      year_start: args.yearStart,
      year_end: args.yearEnd,
      manual_type: args.type,
      total_pages: parsedDoc.totalPages,
      processing_status: 'processing',
    })
    .select('id')
    .single()

  if (docError || !docSource) {
    console.error('  Failed to create document source:', docError?.message)
    process.exit(1)
  }

  console.log(`  Document source ID: ${docSource.id}`)

  // Step 3: Chunk document
  console.log('\n[3/5] Chunking document...')

  const chunks = chunkDocument(parsedDoc.pages, {
    make: args.make,
    model: args.model,
    yearStart: args.yearStart,
    yearEnd: args.yearEnd,
    manualType: args.type,
  })

  console.log(`  Chunks: ${chunks.length}`)

  if (chunks.length === 0) {
    console.log('  No chunks produced — document may be empty or too short.')
    await supabase
      .from('document_sources')
      .update({ processing_status: 'failed', processing_error: 'No chunks produced' })
      .eq('id', docSource.id)
    process.exit(1)
  }

  // Step 4: Generate embeddings
  console.log('\n[4/5] Generating embeddings...')

  const chunkTexts = chunks.map((c) => c.content)
  let allEmbeddings: number[][] = []
  let totalTokens = 0

  // Process in batches to show progress
  for (let i = 0; i < chunkTexts.length; i += BATCH_SIZE) {
    const batch = chunkTexts.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(chunkTexts.length / BATCH_SIZE)

    console.log(`  Batch ${batchNum}/${totalBatches} (${batch.length} chunks)...`)

    try {
      const result = await generateBatchEmbeddings(batch, openai)
      allEmbeddings = allEmbeddings.concat(result.embeddings)
      totalTokens += result.totalTokens
    } catch (err) {
      console.error(`  Failed to generate embeddings:`, err instanceof Error ? err.message : err)
      await supabase
        .from('document_sources')
        .update({ processing_status: 'failed', processing_error: 'Embedding generation failed' })
        .eq('id', docSource.id)
      process.exit(1)
    }

    // Brief pause between batches to avoid rate limiting
    if (i + BATCH_SIZE < chunkTexts.length) {
      await sleep(200)
    }
  }

  console.log(`  Total tokens: ${totalTokens}`)
  console.log(`  Estimated cost: $${((totalTokens / 1_000_000) * 0.02).toFixed(6)}`)

  // Step 5: Store chunks in Supabase
  console.log('\n[5/5] Storing chunks in Supabase...')

  // Find motorcycle_id if one matches
  const { data: motorcycle } = await supabase
    .from('motorcycles')
    .select('id')
    .ilike('make', args.make)
    .ilike('model', `%${args.model}%`)
    .limit(1)

  const motorcycleId = motorcycle?.[0]?.id ?? null

  let insertedCount = 0
  let failedCount = 0

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE).map((chunk, idx) => ({
      document_source_id: docSource.id,
      chunk_index: i + idx,
      content: chunk.content,
      content_length: chunk.contentLength,
      embedding: JSON.stringify(allEmbeddings[i + idx]),
      motorcycle_id: motorcycleId,
      make: args.make,
      model: args.model,
      section_title: chunk.sectionTitle,
      section_hierarchy: chunk.sectionHierarchy,
      page_numbers: chunk.pageNumbers,
      content_type: chunk.contentType,
    }))

    const { error } = await supabase.from('document_chunks').insert(batch)

    if (error) {
      console.error(`  Batch insert failed: ${error.message}`)
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
      processing_error: failedCount > 0 ? `${failedCount} chunks failed to insert` : null,
    })
    .eq('id', docSource.id)

  // Summary
  console.log('\n===========================')
  console.log(`Done: ${insertedCount} chunks stored, ${failedCount} failed`)
  console.log(`Document source: ${docSource.id}`)
  console.log(`Status: ${finalStatus}`)

  if (motorcycleId) {
    console.log(`Linked to motorcycle: ${motorcycleId}`)
  } else {
    console.log('No matching motorcycle found in database')
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
