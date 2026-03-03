#!/usr/bin/env npx tsx

/**
 * CrankDoc Web Scraping Script
 *
 * Scrapes publicly available motorcycle specs and technical data from
 * Wikipedia (CC-BY-SA) and other public sources, then ingests the content
 * into the RAG pipeline for semantic search.
 *
 * Usage:
 *   npx tsx scripts/scrape-bike-specs.ts --bikes all
 *   npx tsx scripts/scrape-bike-specs.ts --bikes honda-cbr600rr,yamaha-mt-07
 *   npx tsx scripts/scrape-bike-specs.ts --bikes all --dry-run --verbose
 *   npx tsx scripts/scrape-bike-specs.ts --bikes bmw-r1250gs --force
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
  bikes: string[]
  force: boolean
  dryRun: boolean
  delayMs: number
  verbose: boolean
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2)
  const parsed: CliArgs = {
    bikes: ['all'],
    force: false,
    dryRun: false,
    delayMs: 1500,
    verbose: false,
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--bikes':
        parsed.bikes = (args[++i] || 'all').split(',').map((s) => s.trim())
        break
      case '--force':
        parsed.force = true
        break
      case '--dry-run':
        parsed.dryRun = true
        break
      case '--delay':
        parsed.delayMs = parseInt(args[++i], 10) || 1500
        break
      case '--verbose':
        parsed.verbose = true
        break
      default:
        console.error(`Unknown flag: ${args[i]}`)
        console.error('Usage: npx tsx scripts/scrape-bike-specs.ts --bikes all [--force] [--dry-run] [--delay 1500] [--verbose]')
        process.exit(1)
    }
  }

  return parsed
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs()

  console.log('\nCrankDoc Web Scraper')
  console.log('====================\n')
  console.log(`  Bikes: ${args.bikes.join(', ')}`)
  console.log(`  Force: ${args.force}`)
  console.log(`  Dry run: ${args.dryRun}`)
  console.log(`  Delay: ${args.delayMs}ms`)

  // Dynamically import modules (they use path aliases that tsx resolves)
  const { filterBikes, getBikeSlug } = await import('../src/lib/scraper/bikeUrlConfig')
  const { fetchPageContent, delay } = await import('../src/lib/scraper/webScraper')
  const { parseWikipediaHtml } = await import('../src/lib/scraper/wikiParser')
  const { parseWebContent } = await import('../src/lib/rag/documentParser')
  const { chunkDocument } = await import('../src/lib/rag/chunker')
  const { generateBatchEmbeddings, createOpenAIClient } = await import('../src/lib/rag/embeddings')
  const { registerParser, getParser } = await import('../src/lib/scraper/parsers/parserRegistry')
  const { parseMotorcycleSpecsHtml } = await import('../src/lib/scraper/parsers/motorcyclespecsParser')
  const { isUrlAllowed } = await import('../src/lib/scraper/robotsChecker')

  // Register parsers
  registerParser('motorcyclespecs', parseMotorcycleSpecsHtml)

  const bikes = filterBikes(args.bikes)
  console.log(`\n  Found ${bikes.length} bike(s) to scrape\n`)

  if (bikes.length === 0) {
    console.error('No bikes matched the provided slugs.')
    console.error('Available slugs:')
    const { BIKE_CONFIGS } = await import('../src/lib/scraper/bikeUrlConfig')
    for (const bike of BIKE_CONFIGS) {
      console.error(`  ${getBikeSlug(bike)}`)
    }
    process.exit(1)
  }

  const openai = args.dryRun ? null : createOpenAIClient()

  // Stats
  let totalSourcesFetched = 0
  let totalSourcesSkipped = 0
  let totalSourcesFailed = 0
  let totalChunksStored = 0
  let totalTokens = 0
  let totalCost = 0

  for (const bike of bikes) {
    const slug = getBikeSlug(bike)
    console.log(`\n${'='.repeat(60)}`)
    console.log(`${bike.make} ${bike.model} (${slug})`)
    console.log('='.repeat(60))

    for (const source of bike.sources) {
      console.log(`\n  Source: ${source.label}`)
      console.log(`  URL: ${source.url}`)

      // Step 1: Dedup check
      if (!args.force) {
        const { data: existing } = await supabase
          .from('document_sources')
          .select('id, title')
          .eq('source_type', 'web')
          .eq('file_path', source.url)
          .limit(1)

        if (existing && existing.length > 0) {
          console.log(`  SKIPPED: already ingested as "${existing[0].title}" (${existing[0].id})`)
          totalSourcesSkipped++
          continue
        }
      }

      // Step 1.5: Robots.txt check
      const robotsAllowed = await isUrlAllowed(source.url)
      if (!robotsAllowed) {
        console.log('  SKIPPED: blocked by robots.txt')
        totalSourcesSkipped++
        continue
      }

      // Step 2: Fetch
      console.log('  [1/5] Fetching...')
      let fetchResult
      try {
        fetchResult = await fetchPageContent(source)
        console.log(`  Fetched: ${fetchResult.contentLength} chars, title: "${fetchResult.title}"`)
      } catch (error) {
        console.error(`  FAILED to fetch: ${error instanceof Error ? error.message : String(error)}`)
        totalSourcesFailed++
        continue
      }

      // Step 3: Parse
      console.log('  [2/5] Parsing...')
      let parsedText: string
      let title: string

      if (source.sourceType === 'wikipedia') {
        const wikiResult = await parseWikipediaHtml(fetchResult.html, fetchResult.title)
        parsedText = wikiResult.fullText
        title = fetchResult.title

        if (args.verbose) {
          console.log(`    Infobox: ${wikiResult.infoboxText ? 'found' : 'not found'}`)
          console.log(`    Sections: ${wikiResult.sections.length}`)
          console.log(`    Full text length: ${parsedText.length} chars`)
        }
      } else if (source.parserId && getParser(source.parserId)) {
        // Use registered parser for known source types
        const parser = getParser(source.parserId)!
        const parseResult = await parser(fetchResult.html, fetchResult.title)
        parsedText = parseResult.fullText
        title = fetchResult.title

        if (args.verbose) {
          console.log(`    Parser: ${source.parserId}`)
          console.log(`    Sections: ${parseResult.sections.length}`)
          console.log(`    Full text length: ${parsedText.length} chars`)
        }
      } else {
        // Generic fallback for unknown sources
        const webDoc = await parseWebContent(fetchResult.html, fetchResult.title)
        parsedText = webDoc.pages.map((p) => p.text).join('\n\n')
        title = fetchResult.title
      }

      if (!parsedText || parsedText.length < 100) {
        console.log(`  SKIPPED: parsed text too short (${parsedText?.length || 0} chars)`)
        totalSourcesFailed++
        continue
      }

      totalSourcesFetched++

      // Convert to pages array for the chunker
      const pages = [{
        pageNumber: 1,
        text: parsedText,
        isScanned: false,
      }]

      // Step 4: Chunk
      console.log('  [3/5] Chunking...')
      const chunks = chunkDocument(pages, {
        make: bike.make,
        model: bike.model,
        yearStart: bike.yearStart,
        yearEnd: bike.yearEnd,
        manualType: 'web',
      })

      console.log(`    Chunks: ${chunks.length}`)

      if (args.verbose) {
        const typeCount: Record<string, number> = {}
        for (const chunk of chunks) {
          typeCount[chunk.contentType] = (typeCount[chunk.contentType] || 0) + 1
        }
        for (const [type, count] of Object.entries(typeCount)) {
          console.log(`    ${type}: ${count}`)
        }
      }

      if (chunks.length === 0) {
        console.log('  SKIPPED: no chunks produced')
        totalSourcesFailed++
        continue
      }

      if (args.dryRun) {
        console.log('  [DRY RUN] Would embed and store chunks — skipping')
        if (args.verbose) {
          for (const chunk of chunks.slice(0, 3)) {
            console.log(`\n    --- Chunk ${chunk.chunkIndex} (${chunk.contentType}) ---`)
            console.log(`    ${chunk.content.substring(0, 200)}...`)
          }
        }
        continue
      }

      // Step 5: Embed
      console.log('  [4/5] Generating embeddings...')
      const chunkTexts = chunks.map((c) => c.content)
      let allEmbeddings: number[][] = []
      let batchTokens = 0

      for (let i = 0; i < chunkTexts.length; i += EMBED_BATCH_SIZE) {
        const batch = chunkTexts.slice(i, i + EMBED_BATCH_SIZE)
        const batchNum = Math.floor(i / EMBED_BATCH_SIZE) + 1
        const totalBatches = Math.ceil(chunkTexts.length / EMBED_BATCH_SIZE)

        if (args.verbose) {
          console.log(`    Batch ${batchNum}/${totalBatches} (${batch.length} chunks)...`)
        }

        try {
          const result = await generateBatchEmbeddings(batch, openai!)
          allEmbeddings = allEmbeddings.concat(result.embeddings)
          batchTokens += result.totalTokens
        } catch (error) {
          console.error(`  FAILED to embed: ${error instanceof Error ? error.message : String(error)}`)
          totalSourcesFailed++
          continue
        }

        if (i + EMBED_BATCH_SIZE < chunkTexts.length) {
          await sleep(200)
        }
      }

      const cost = (batchTokens / 1_000_000) * 0.02
      totalTokens += batchTokens
      totalCost += cost
      console.log(`    Tokens: ${batchTokens}, cost: $${cost.toFixed(6)}`)

      // Step 6: Store
      console.log('  [5/5] Storing in Supabase...')

      // Create document_sources record
      const { data: docSource, error: docError } = await supabase
        .from('document_sources')
        .insert({
          title,
          source_type: 'web',
          file_path: source.url,
          file_hash: null,
          make: bike.make,
          model: bike.model,
          year_start: bike.yearStart,
          year_end: bike.yearEnd,
          manual_type: null,
          total_pages: 1,
          processing_status: 'processing',
        })
        .select('id')
        .single()

      if (docError || !docSource) {
        console.error(`  FAILED to create document source: ${docError?.message}`)
        totalSourcesFailed++
        continue
      }

      // Find motorcycle_id
      const { data: motorcycle } = await supabase
        .from('motorcycles')
        .select('id')
        .ilike('make', bike.make)
        .ilike('model', `%${bike.model}%`)
        .limit(1)

      const motorcycleId = motorcycle?.[0]?.id ?? null

      // Insert chunks
      let insertedCount = 0
      let failedCount = 0

      for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
        const batch = chunks.slice(i, i + EMBED_BATCH_SIZE).map((chunk, idx) => ({
          document_source_id: docSource.id,
          chunk_index: i + idx,
          content: chunk.content,
          content_length: chunk.contentLength,
          embedding: JSON.stringify(allEmbeddings[i + idx]),
          motorcycle_id: motorcycleId,
          make: bike.make,
          model: bike.model,
          section_title: chunk.sectionTitle,
          section_hierarchy: chunk.sectionHierarchy,
          page_numbers: chunk.pageNumbers,
          content_type: chunk.contentType,
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
          processing_error: failedCount > 0 ? `${failedCount} chunks failed to insert` : null,
        })
        .eq('id', docSource.id)

      totalChunksStored += insertedCount
      console.log(`    Stored: ${insertedCount} chunks`)
      if (motorcycleId) {
        console.log(`    Linked to motorcycle: ${motorcycleId}`)
      }

      // Rate limit between sources
      await delay(args.delayMs)
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`)
  console.log('SUMMARY')
  console.log('='.repeat(60))
  console.log(`  Sources fetched: ${totalSourcesFetched}`)
  console.log(`  Sources skipped: ${totalSourcesSkipped}`)
  console.log(`  Sources failed:  ${totalSourcesFailed}`)
  console.log(`  Chunks stored:   ${totalChunksStored}`)
  console.log(`  Total tokens:    ${totalTokens}`)
  console.log(`  Total cost:      $${totalCost.toFixed(6)}`)
  console.log()
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
