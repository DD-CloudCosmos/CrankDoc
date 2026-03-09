'use client'

import Link from 'next/link'
import { Bike, AlertTriangle, BookOpen, Stethoscope, AlertCircle } from 'lucide-react'
import type { SearchCategory, SearchResultItem as SearchResultItemType } from '@/types/search.types'

interface SearchResultItemProps {
  result: SearchResultItemType
  onClick?: () => void
}

const CATEGORY_ICONS: Record<SearchCategory, typeof Bike> = {
  bikes: Bike,
  dtcCodes: AlertTriangle,
  glossaryTerms: BookOpen,
  diagnosticTrees: Stethoscope,
  recalls: AlertCircle,
}

/**
 * A single search result row with category icon, title, and subtitle.
 * Renders as a next/link to the appropriate page.
 */
export function SearchResultItem({ result, onClick }: SearchResultItemProps) {
  const Icon = CATEGORY_ICONS[result.category]

  return (
    <Link
      href={result.href}
      onClick={onClick}
      className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-foreground transition-colors hover:bg-muted/50"
      data-testid="search-result-item"
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{result.title}</p>
        <p className="truncate text-xs text-muted-foreground">{result.subtitle}</p>
      </div>
    </Link>
  )
}
