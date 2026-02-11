import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { DiagnosticTree } from '@/types/database.types'
import { ChevronRight } from 'lucide-react'

interface DiagnosticTreeCardProps {
  tree: DiagnosticTree
  motorcycleName?: string
}

const difficultyVariant = (difficulty: string | null) => {
  switch (difficulty) {
    case 'beginner':
      return 'secondary'
    case 'intermediate':
      return 'default'
    case 'advanced':
      return 'destructive'
    default:
      return 'outline'
  }
}

export function DiagnosticTreeCard({ tree, motorcycleName }: DiagnosticTreeCardProps) {
  return (
    <Link href={`/diagnose/${tree.id}`}>
      <Card className="transition-colors hover:bg-accent">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">{tree.title}</CardTitle>
            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
          {tree.description && (
            <CardDescription>{tree.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {tree.difficulty && (
              <Badge variant={difficultyVariant(tree.difficulty)}>
                {tree.difficulty}
              </Badge>
            )}
            {tree.category && (
              <Badge variant="outline">
                {tree.category}
              </Badge>
            )}
            {motorcycleName && (
              <span className="text-xs text-muted-foreground">{motorcycleName}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
