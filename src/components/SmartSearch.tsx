'use client'

import { useState, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Loader2, BookOpen, FileText } from 'lucide-react'

/** Source metadata returned after the stream delimiter */
export interface RagSource {
  sectionTitle: string | null
  pageNumbers: number[] | null
  contentType: string
  make: string | null
  model: string | null
  similarity: number
}

interface SmartSearchProps {
  motorcycleId?: string
  make?: string
  model?: string
}

/** Delimiter that separates the AI answer text from JSON source data in the stream */
const SOURCES_DELIMITER = '---SOURCES---'

const EXAMPLE_QUESTIONS = [
  'What is the valve clearance for a CBR600RR?',
  'How do I change the oil on a Ninja 400?',
  'What does DTC P0131 mean on a Honda?',
  'What are the torque specs for an R1250GS cylinder head?',
]

/** Displays source citations from the RAG response */
export function SmartSearchSources({ sources }: { sources: RagSource[] }) {
  return (
    <Card data-testid="sources-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="h-4 w-4" />
          Sources ({sources.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {sources.map((source, index) => (
            <li
              key={`${source.sectionTitle}-${index}`}
              className="flex items-start gap-3 text-sm"
            >
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">
                  {source.sectionTitle ?? 'Untitled section'}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-xs">
                    {source.contentType}
                  </Badge>
                  {source.make && (
                    <Badge variant="secondary" className="text-xs">
                      {source.make}
                    </Badge>
                  )}
                  {source.model && (
                    <Badge variant="secondary" className="text-xs">
                      {source.model}
                    </Badge>
                  )}
                  {source.pageNumbers && source.pageNumbers.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      p. {source.pageNumbers.join(', ')}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className="text-xs text-muted-foreground"
                  >
                    {Math.round(source.similarity * 100)}% match
                  </Badge>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

/**
 * SmartSearch — AI-powered semantic search component.
 *
 * Streams an answer from the RAG query API and displays
 * source citations after the response completes.
 */
export function SmartSearch({ motorcycleId, make, model }: SmartSearchProps) {
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState('')
  const [sources, setSources] = useState<RagSource[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleSubmit = useCallback(
    async (e?: React.FormEvent, overrideQuery?: string) => {
      if (e) e.preventDefault()

      const searchQuery = overrideQuery ?? query
      if (!searchQuery.trim()) return

      // Abort any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      const controller = new AbortController()
      abortControllerRef.current = controller

      setAnswer('')
      setSources([])
      setError(null)
      setIsLoading(true)

      try {
        const response = await fetch('/api/rag/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: searchQuery,
            motorcycleId,
            make,
            model,
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          throw new Error(
            (errorData as { error?: string } | null)?.error ?? 'Search request failed. Please try again.'
          )
        }

        if (!response.body) {
          throw new Error('No response stream available')
        }

        // Read the streaming response
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let accumulated = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          accumulated += decoder.decode(value, { stream: true })

          // Check if we have the delimiter yet
          const delimiterIndex = accumulated.indexOf(SOURCES_DELIMITER)
          if (delimiterIndex === -1) {
            // No delimiter yet — everything so far is answer text
            setAnswer(accumulated)
          } else {
            // Delimiter found — split answer from sources
            const answerText = accumulated.substring(0, delimiterIndex).trimEnd()
            setAnswer(answerText)

            // Sources JSON comes after delimiter + newline
            const sourcesRaw = accumulated.substring(
              delimiterIndex + SOURCES_DELIMITER.length
            ).trim()
            if (sourcesRaw) {
              try {
                const parsed: RagSource[] = JSON.parse(sourcesRaw)
                setSources(parsed)
              } catch {
                // Sources JSON may be incomplete — will parse after stream ends
              }
            }
          }
        }

        // Final flush of decoder
        accumulated += decoder.decode()

        // Final parse after stream is complete
        const delimiterIndex = accumulated.indexOf(SOURCES_DELIMITER)
        if (delimiterIndex !== -1) {
          const answerText = accumulated.substring(0, delimiterIndex).trimEnd()
          setAnswer(answerText)

          const sourcesRaw = accumulated
            .substring(delimiterIndex + SOURCES_DELIMITER.length)
            .trim()
          if (sourcesRaw) {
            try {
              const parsed: RagSource[] = JSON.parse(sourcesRaw)
              setSources(parsed)
            } catch {
              // Sources JSON could not be parsed — display answer without sources
            }
          }
        } else {
          // No delimiter found at all — treat entire response as answer
          setAnswer(accumulated)
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return // Request was cancelled — no error to show
        }
        setError(
          err instanceof Error ? err.message : 'Search request failed. Please try again.'
        )
      } finally {
        setIsLoading(false)
      }
    },
    [query, motorcycleId, make, model]
  )

  const handleExampleClick = (exampleQuery: string) => {
    setQuery(exampleQuery)
    handleSubmit(undefined, exampleQuery)
  }

  return (
    <div className="space-y-4">
      {/* Filtered bike context badge */}
      {make && model && (
        <Badge variant="secondary" data-testid="bike-filter-badge">
          <Sparkles className="mr-1 h-3 w-3" />
          {make} {model}
        </Badge>
      )}

      {/* Search form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Ask about motorcycle maintenance..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" disabled={isLoading || !query.trim()}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Search
        </Button>
      </form>

      {/* Example questions */}
      {!answer && !isLoading && (
        <div className="space-y-2" data-testid="example-questions">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Try asking
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleExampleClick(q)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-center"
          data-testid="error-message"
        >
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Answer display */}
      {(answer || isLoading) && (
        <Card data-testid="answer-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              AI Answer
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && !answer && (
              <div
                className="space-y-2"
                data-testid="answer-skeleton"
              >
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
              </div>
            )}
            {answer && (
              <div className="whitespace-pre-wrap text-sm text-foreground">
                {answer}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sources */}
      {sources.length > 0 && <SmartSearchSources sources={sources} />}
    </div>
  )
}
