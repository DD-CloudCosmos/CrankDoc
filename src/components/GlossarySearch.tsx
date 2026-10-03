'use client'

import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface GlossarySearchProps {
  onSearch: (query: string) => void
  defaultValue?: string
}

export function GlossarySearch({ onSearch, defaultValue = '' }: GlossarySearchProps) {
  return (
    <div className="relative">
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        aria-label="Search glossary terms"
        placeholder="Search motorcycle terms..."
        defaultValue={defaultValue}
        onChange={(e) => onSearch(e.target.value)}
        className="rounded-[10px] pl-9"
      />
    </div>
  )
}
