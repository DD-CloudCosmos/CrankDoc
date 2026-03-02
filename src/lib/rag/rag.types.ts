/**
 * RAG System Types
 *
 * TypeScript interfaces specific to the RAG pipeline:
 * embedding generation, vector search, and query responses.
 */

/** Embedding dimensions used by text-embedding-3-small */
export const EMBEDDING_DIMENSIONS = 512

/** Parameters for generating embeddings */
export interface EmbeddingRequest {
  text: string
}

/** Result of an embedding generation call */
export interface EmbeddingResult {
  embedding: number[]
  tokenCount: number
}

/** Parameters for batch embedding generation */
export interface BatchEmbeddingRequest {
  texts: string[]
}

/** Result of a batch embedding generation call */
export interface BatchEmbeddingResult {
  embeddings: number[][]
  totalTokens: number
}

/** Filters for vector similarity search */
export interface VectorSearchFilters {
  motorcycleId?: string
  make?: string
  model?: string
  contentType?: string
}

/** Parameters for a vector similarity search query */
export interface VectorSearchParams {
  queryEmbedding: number[]
  matchCount?: number
  filters?: VectorSearchFilters
  similarityThreshold?: number
}

/** A single result from vector similarity search */
export interface VectorSearchResult {
  id: string
  content: string
  sectionTitle: string | null
  sectionHierarchy: string[] | null
  pageNumbers: number[] | null
  contentType: string
  make: string | null
  model: string | null
  similarity: number
}

/** Full RAG query request from the client */
export interface RagQueryRequest {
  query: string
  motorcycleId?: string
  make?: string
  model?: string
  contentType?: string
  maxResults?: number
}

/** Source citation included in RAG query responses */
export interface RagSourceCitation {
  chunkId: string
  content: string
  sectionTitle: string | null
  pageNumbers: number[] | null
  similarity: number
  documentTitle?: string
}

/** Full RAG query response */
export interface RagQueryResponse {
  answer: string
  sources: RagSourceCitation[]
  usage: {
    embeddingTokens: number
    llmPromptTokens: number
    llmCompletionTokens: number
  }
}
