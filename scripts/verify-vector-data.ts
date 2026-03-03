#!/usr/bin/env npx tsx

/**
 * Vector Data Verification
 *
 * Reports on the health and completeness of the vector database.
 * Runs after populating the vector DB to confirm data is present
 * and similarity search works correctly.
 *
 * Usage:
 *   npx tsx scripts/verify-vector-data.ts
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

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function main() {
  console.log('\nCrankDoc Vector Data Verification')
  console.log('==================================\n')

  // 1. Document sources overview
  console.log('--- Document Sources ---')
  const { data: sources } = await supabase
    .from('document_sources')
    .select('id, source_type, processing_status, make, model')

  if (!sources || sources.length === 0) {
    console.log('  No document sources found! Run embed scripts first.')
  } else {
    // Count by source_type
    const byType: Record<string, number> = {}
    const byStatus: Record<string, number> = {}
    for (const s of sources) {
      byType[s.source_type] = (byType[s.source_type] || 0) + 1
      byStatus[s.processing_status] = (byStatus[s.processing_status] || 0) + 1
    }
    console.log('  By source type:')
    for (const [type, count] of Object.entries(byType)) {
      console.log(`    ${type}: ${count}`)
    }
    console.log('  By status:')
    for (const [status, count] of Object.entries(byStatus)) {
      console.log(`    ${status}: ${count}`)
    }
  }

  // 2. Document chunks overview
  console.log('\n--- Document Chunks ---')
  const { count: totalChunks } = await supabase
    .from('document_chunks')
    .select('id', { count: 'exact', head: true })

  console.log(`  Total chunks: ${totalChunks ?? 0}`)

  // Count by content_type and make
  const { data: chunks } = await supabase
    .from('document_chunks')
    .select('content_type, make, model')

  if (chunks && chunks.length > 0) {
    const byContentType: Record<string, number> = {}
    const byMake: Record<string, number> = {}
    for (const c of chunks) {
      byContentType[c.content_type] = (byContentType[c.content_type] || 0) + 1
      if (c.make) {
        const key = `${c.make} ${c.model || '(no model)'}`
        byMake[key] = (byMake[key] || 0) + 1
      }
    }
    console.log('  By content type:')
    for (const [type, count] of Object.entries(byContentType).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${type}: ${count}`)
    }
    console.log('  By motorcycle:')
    for (const [bike, count] of Object.entries(byMake).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${bike}: ${count}`)
    }
  }

  // 3. Check for issues
  console.log('\n--- Health Checks ---')

  // Check for chunks with null embeddings
  const { count: nullEmbeddings } = await supabase
    .from('document_chunks')
    .select('id', { count: 'exact', head: true })
    .is('embedding', null)

  if (nullEmbeddings && nullEmbeddings > 0) {
    console.log(`  WARNING: ${nullEmbeddings} chunks have NULL embeddings`)
  } else {
    console.log('  All chunks have embeddings: OK')
  }

  // Check for failed sources
  const { data: failedSources } = await supabase
    .from('document_sources')
    .select('id, title, processing_error')
    .eq('processing_status', 'failed')

  if (failedSources && failedSources.length > 0) {
    console.log(`  WARNING: ${failedSources.length} sources failed processing:`)
    for (const s of failedSources) {
      console.log(`    - ${s.title}: ${s.processing_error}`)
    }
  } else {
    console.log('  No failed sources: OK')
  }

  // 4. Sample similarity search (if we have OPENAI_API_KEY and chunks)
  if (OPENAI_API_KEY && totalChunks && totalChunks > 0) {
    console.log('\n--- Sample Similarity Search ---')
    try {
      const { generateEmbedding, createOpenAIClient } = await import('../src/lib/rag/embeddings')
      const openai = createOpenAIClient()

      const testQuery = 'Honda CBR600RR engine specifications'
      console.log(`  Query: "${testQuery}"`)

      const { embedding } = await generateEmbedding(testQuery, openai)

      const { data: results, error } = await supabase.rpc('match_document_chunks', {
        query_embedding: JSON.stringify(embedding),
        match_count: 3,
        filter_motorcycle_id: null,
        filter_make: null,
        filter_model: null,
        filter_content_type: null,
        similarity_threshold: 0.0,
      })

      if (error) {
        console.log(`  Search error: ${error.message}`)
      } else if (results && results.length > 0) {
        console.log(`  Results: ${results.length} matches`)
        for (const r of results) {
          console.log(`    [${(r.similarity * 100).toFixed(1)}%] ${r.make ?? ''} ${r.model ?? ''} — ${r.content_type} — ${r.content?.substring(0, 80)}...`)
        }
        console.log('  Similarity search: OK')
      } else {
        console.log('  No results returned (vectors may not be populated yet)')
      }
    } catch (error) {
      console.log(`  Search test skipped: ${error instanceof Error ? error.message : String(error)}`)
    }
  } else {
    console.log('\n  Skipping similarity search (no OPENAI_API_KEY or no chunks)')
  }

  console.log('\n  Verification complete.\n')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
