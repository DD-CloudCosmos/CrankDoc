/**
 * Search Types
 *
 * Types for the cross-feature smart search.
 * Each search result has a consistent shape regardless of source category.
 */

/** The categories that smart search covers */
export type SearchCategory = 'bikes' | 'dtcCodes' | 'glossaryTerms' | 'diagnosticTrees' | 'recalls'

/** A single search result with enough info to render and link */
export type SearchResultItem = {
  id: string
  title: string
  subtitle: string
  href: string
  category: SearchCategory
}

/** Grouped search response from the API */
export type SearchResponse = {
  bikes: SearchResultItem[]
  dtcCodes: SearchResultItem[]
  glossaryTerms: SearchResultItem[]
  diagnosticTrees: SearchResultItem[]
  recalls: SearchResultItem[]
}

/** Display labels for each category */
export const SEARCH_CATEGORY_LABELS: Record<SearchCategory, string> = {
  bikes: 'Bikes',
  dtcCodes: 'DTC Codes',
  glossaryTerms: 'Glossary',
  diagnosticTrees: 'Diagnostic Guides',
  recalls: 'Recalls',
}
