/**
 * Embedding Generation
 *
 * Wraps the OpenAI text-embedding-3-small API with retry logic
 * following the pattern from nhtsaClient.ts.
 *
 * Server-side only — requires OPENAI_API_KEY environment variable.
 */

import OpenAI from 'openai'
import {
  EMBEDDING_DIMENSIONS,
  type EmbeddingResult,
  type BatchEmbeddingResult,
} from './rag.types'

const MAX_RETRIES = 3
const BACKOFF_MS = [500, 1000, 2000]

/** Maximum texts per OpenAI batch embedding request */
const MAX_BATCH_SIZE = 100

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Creates an OpenAI client using the OPENAI_API_KEY env variable.
 * @throws Error if OPENAI_API_KEY is not set
 */
export function createOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error(
      'Missing OPENAI_API_KEY environment variable. Set it in .env.local'
    )
  }

  return new OpenAI({ apiKey })
}

/**
 * Generates a single embedding vector for the given text.
 *
 * Includes retry logic: up to 3 attempts with exponential backoff
 * (500ms, 1000ms, 2000ms). Throws on final failure.
 */
export async function generateEmbedding(
  text: string,
  client?: OpenAI
): Promise<EmbeddingResult> {
  const openai = client ?? createOpenAIClient()

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        dimensions: EMBEDDING_DIMENSIONS,
      })

      return {
        embedding: response.data[0].embedding,
        tokenCount: response.usage.total_tokens,
      }
    } catch (error) {
      if (attempt < MAX_RETRIES - 1) {
        await delay(BACKOFF_MS[attempt])
      } else {
        throw new Error(
          `Failed to generate embedding after ${MAX_RETRIES} attempts: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }
  }

  // Unreachable, but TypeScript needs it
  throw new Error('Failed to generate embedding')
}

/**
 * Generates embeddings for multiple texts in a single API call.
 *
 * Splits into batches of MAX_BATCH_SIZE if needed. Includes retry
 * logic per batch: up to 3 attempts with exponential backoff.
 */
export async function generateBatchEmbeddings(
  texts: string[],
  client?: OpenAI
): Promise<BatchEmbeddingResult> {
  if (texts.length === 0) {
    return { embeddings: [], totalTokens: 0 }
  }

  const openai = client ?? createOpenAIClient()
  const allEmbeddings: number[][] = []
  let totalTokens = 0

  // Process in batches
  for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
    const batch = texts.slice(i, i + MAX_BATCH_SIZE)

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: batch,
          dimensions: EMBEDDING_DIMENSIONS,
        })

        // OpenAI returns embeddings sorted by index
        const sorted = response.data.sort((a, b) => a.index - b.index)
        for (const item of sorted) {
          allEmbeddings.push(item.embedding)
        }
        totalTokens += response.usage.total_tokens
        break
      } catch (error) {
        if (attempt < MAX_RETRIES - 1) {
          await delay(BACKOFF_MS[attempt])
        } else {
          throw new Error(
            `Failed to generate batch embeddings after ${MAX_RETRIES} attempts: ${error instanceof Error ? error.message : String(error)}`
          )
        }
      }
    }
  }

  return { embeddings: allEmbeddings, totalTokens }
}
