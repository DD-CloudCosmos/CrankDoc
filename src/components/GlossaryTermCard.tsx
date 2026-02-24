'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { GlossaryTerm } from '@/types/database.types'

interface GlossaryTermCardProps {
  term: GlossaryTerm
  onRelatedTermClick?: (termName: string) => void
}

const DIFFICULTY_STYLES: Record<string, { borderClass: string; label: string }> = {
  beginner: { borderClass: 'border-green-500 text-green-700', label: 'Beginner' },
  intermediate: { borderClass: 'border-amber-500 text-amber-700', label: 'Intermediate' },
  advanced: { borderClass: 'border-red-500 text-red-700', label: 'Advanced' },
}

export function GlossaryTermCard({ term, onRelatedTermClick }: GlossaryTermCardProps) {
  const difficultyStyle = term.difficulty ? DIFFICULTY_STYLES[term.difficulty] : null

  return (
    <Card>
      <CardHeader>
        {term.illustration_url && (
          <img
            src={term.illustration_url}
            alt={term.term}
            className="mb-3 h-32 w-full object-contain"
          />
        )}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold">{term.term}</h3>
          <div className="flex shrink-0 gap-1.5">
            <Badge variant="outline">{term.category}</Badge>
            {difficultyStyle && (
              <Badge variant="outline" className={difficultyStyle.borderClass}>
                {difficultyStyle.label}
              </Badge>
            )}
          </div>
        </div>
        {term.aliases && term.aliases.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Also known as: {term.aliases.join(', ')}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground">{term.definition}</p>
        {term.related_terms && term.related_terms.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">See also:</span>
            {term.related_terms.map((related) => (
              <Button
                key={related}
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-0.5 text-xs"
                onClick={() => onRelatedTermClick?.(related)}
              >
                {related}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
