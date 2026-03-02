#!/usr/bin/env npx tsx

/**
 * CrankDoc Structured Data Extraction Script
 *
 * Uses Claude to extract structured data from ingested document chunks
 * and stores the results in extraction_jobs for human review.
 *
 * Usage:
 *   npx tsx scripts/extract-to-tables.ts --source-id <uuid> --type specs
 *   npx tsx scripts/extract-to-tables.ts --source-id <uuid> --type service_intervals
 *   npx tsx scripts/extract-to-tables.ts --source-id <uuid> --type dtc_codes
 *   npx tsx scripts/extract-to-tables.ts --source-id <uuid> --type all
 */

import path from 'path'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

if (!ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const LLM_MODEL = 'claude-sonnet-4-20250514'

const EXTRACTION_TYPES = ['specs', 'service_intervals', 'dtc_codes'] as const
type ExtractionType = (typeof EXTRACTION_TYPES)[number]

interface CliArgs {
  sourceId: string
  type: ExtractionType | 'all'
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

  if (!parsed['source-id']) {
    console.error('Required: --source-id <uuid>')
    process.exit(1)
  }

  const type = parsed.type || 'all'
  if (type !== 'all' && !EXTRACTION_TYPES.includes(type as ExtractionType)) {
    console.error(`Invalid type: ${type}. Must be one of: ${EXTRACTION_TYPES.join(', ')}, all`)
    process.exit(1)
  }

  return {
    sourceId: parsed['source-id'],
    type: type as ExtractionType | 'all',
  }
}

async function runExtraction(
  sourceId: string,
  extractionType: ExtractionType,
  anthropic: Anthropic
): Promise<void> {
  console.log(`\n  Extracting: ${extractionType}`)

  // Dynamically import extractor module
  const {
    getExtractionPrompt,
    buildExtractionMessages,
    estimateCost,
    validateExtractionResult,
    TARGET_TABLE_MAP,
  } = await import('../src/lib/rag/extractor')

  // Fetch document source metadata
  const { data: docSource, error: docError } = await supabase
    .from('document_sources')
    .select('*')
    .eq('id', sourceId)
    .single()

  if (docError || !docSource) {
    console.error(`  Document source not found: ${sourceId}`)
    return
  }

  // Fetch relevant chunks
  const contentTypeFilters: Record<ExtractionType, string[]> = {
    specs: ['spec_table', 'torque_table', 'prose'],
    service_intervals: ['procedure', 'spec_table', 'prose'],
    dtc_codes: ['prose', 'spec_table'],
  }

  const { data: chunks, error: chunkError } = await supabase
    .from('document_chunks')
    .select('id, content, content_type')
    .eq('document_source_id', sourceId)
    .in('content_type', contentTypeFilters[extractionType])
    .order('chunk_index')

  if (chunkError || !chunks || chunks.length === 0) {
    console.log(`  No relevant chunks found for ${extractionType} extraction`)
    return
  }

  console.log(`  Found ${chunks.length} relevant chunks`)

  // Create extraction job record
  const { data: job, error: jobError } = await supabase
    .from('extraction_jobs')
    .insert({
      document_source_id: sourceId,
      extraction_type: extractionType,
      target_table: TARGET_TABLE_MAP[extractionType],
      status: 'running',
      chunks_used: chunks.map((c) => c.id),
      llm_model: LLM_MODEL,
    })
    .select('id')
    .single()

  if (jobError || !job) {
    console.error(`  Failed to create extraction job: ${jobError?.message}`)
    return
  }

  console.log(`  Job ID: ${job.id}`)

  // Build extraction messages
  const metadata = {
    make: docSource.make || 'Unknown',
    model: docSource.model || 'Unknown',
    yearStart: docSource.year_start || 0,
    yearEnd: docSource.year_end,
  }

  // Use getExtractionPrompt to verify we have a valid prompt
  getExtractionPrompt(extractionType, metadata)

  const messages = buildExtractionMessages({
    documentSourceId: sourceId,
    extractionType,
    chunks: chunks.map((c) => ({
      id: c.id,
      content: c.content,
      contentType: c.content_type,
    })),
    metadata,
  })

  // Call Claude
  console.log('  Calling Claude...')

  try {
    const response = await anthropic.messages.create({
      model: LLM_MODEL,
      max_tokens: 4000,
      system: messages.system,
      messages: [{ role: 'user', content: messages.user }],
    })

    const textContent = response.content.find((c) => c.type === 'text')
    const responseText = textContent ? textContent.text : ''

    // Try to parse JSON from the response
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
      responseText.match(/\[[\s\S]*\]/) ||
      responseText.match(/\{[\s\S]*\}/)

    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText

    let extractedData: unknown
    try {
      extractedData = JSON.parse(jsonStr)
    } catch {
      console.error('  Failed to parse JSON from Claude response')
      await supabase
        .from('extraction_jobs')
        .update({
          status: 'failed',
          error_message: 'Failed to parse JSON from response',
          prompt_tokens: response.usage.input_tokens,
          completion_tokens: response.usage.output_tokens,
          cost_usd: estimateCost(response.usage.input_tokens, response.usage.output_tokens, LLM_MODEL),
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id)
      return
    }

    // Validate
    const validation = validateExtractionResult(extractedData, extractionType)
    const status = validation.valid ? 'needs_review' : 'failed'

    if (!validation.valid) {
      console.log(`  Validation errors: ${validation.errors.join(', ')}`)
    }

    const cost = estimateCost(
      response.usage.input_tokens,
      response.usage.output_tokens,
      LLM_MODEL
    )

    // Update job with results
    await supabase
      .from('extraction_jobs')
      .update({
        status,
        result_data: extractedData,
        error_message: validation.valid ? null : validation.errors.join('; '),
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        cost_usd: cost,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id)

    console.log(`  Status: ${status}`)
    console.log(`  Tokens: ${response.usage.input_tokens} in, ${response.usage.output_tokens} out`)
    console.log(`  Cost: $${cost.toFixed(6)}`)

    if (validation.valid) {
      console.log('  Result stored for review in extraction_jobs table')
    }
  } catch (err) {
    console.error(`  Claude API error: ${err instanceof Error ? err.message : err}`)
    await supabase
      .from('extraction_jobs')
      .update({
        status: 'failed',
        error_message: err instanceof Error ? err.message : String(err),
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id)
  }
}

async function main() {
  const args = parseArgs()

  console.log('\nCrankDoc Structured Extraction')
  console.log('===============================\n')
  console.log(`  Source ID: ${args.sourceId}`)
  console.log(`  Extraction type: ${args.type}`)

  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

  const types: ExtractionType[] =
    args.type === 'all' ? [...EXTRACTION_TYPES] : [args.type]

  for (const type of types) {
    await runExtraction(args.sourceId, type, anthropic)
  }

  console.log('\n===============================')
  console.log('Done')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
