/**
 * RAG System Prompts
 *
 * System prompts and context assembly functions for the CrankDoc
 * RAG query pipeline. Enforces safety guidelines and citation rules.
 */

import type { VectorSearchResult } from './rag.types'

/**
 * System prompt for RAG-powered query responses.
 * Enforces CrankDoc safety guidelines, citation requirements,
 * and accuracy standards.
 */
export const CRANKDOC_RAG_SYSTEM_PROMPT = `You are CrankDoc, a motorcycle diagnostic assistant. You answer questions about motorcycle maintenance, repair, specifications, and diagnostics using ONLY the provided reference material.

RULES:
1. Only answer based on the provided context. If the context does not contain the answer, say "I don't have that information in my reference materials for this motorcycle."
2. Always cite the source section and page number when available.
3. Use exact values from the reference material — never estimate or round specifications.
4. Include safety warnings for any work involving: electrical systems, fuel systems, brakes, suspension, or structural components.
5. Specify the correct units (Nm, lb-ft, mm, in, L, qt) and provide both metric and imperial where the source does.
6. If a procedure requires special tools, mention them.
7. Never instruct users to bypass safety systems or exceed stated skill levels.
8. Format your response clearly: use bullet points for specs, numbered steps for procedures.`

/**
 * Formats retrieved chunks into a context block for the LLM prompt.
 *
 * Each chunk is labeled with its source metadata (section, pages,
 * content type) so the LLM can produce accurate citations.
 */
export function formatChunksAsContext(chunks: VectorSearchResult[]): string {
  if (chunks.length === 0) {
    return 'No relevant reference material found.'
  }

  const formattedChunks = chunks.map((chunk, index) => {
    const parts: string[] = []

    parts.push(`--- Reference ${index + 1} ---`)

    if (chunk.make || chunk.model) {
      parts.push(`Motorcycle: ${[chunk.make, chunk.model].filter(Boolean).join(' ')}`)
    }

    if (chunk.sectionTitle) {
      parts.push(`Section: ${chunk.sectionTitle}`)
    }

    if (chunk.sectionHierarchy && chunk.sectionHierarchy.length > 0) {
      parts.push(`Path: ${chunk.sectionHierarchy.join(' > ')}`)
    }

    if (chunk.pageNumbers && chunk.pageNumbers.length > 0) {
      parts.push(`Page(s): ${chunk.pageNumbers.join(', ')}`)
    }

    parts.push(`Type: ${chunk.contentType}`)
    parts.push(`Relevance: ${(chunk.similarity * 100).toFixed(0)}%`)
    parts.push('')
    parts.push(chunk.content)

    return parts.join('\n')
  })

  return formattedChunks.join('\n\n')
}

/**
 * Assembles the full user prompt with retrieved context.
 *
 * Combines the user's question with the formatted reference
 * material so the LLM can generate an informed answer.
 */
export function assembleRagPrompt(
  userQuery: string,
  chunks: VectorSearchResult[]
): string {
  const context = formatChunksAsContext(chunks)

  return `REFERENCE MATERIAL:
${context}

USER QUESTION:
${userQuery}

Answer the question using ONLY the reference material above. Cite sections and page numbers where available.`
}
