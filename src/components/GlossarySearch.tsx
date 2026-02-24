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
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search motorcycle terms..."
        defaultValue={defaultValue}
        onChange={(e) => onSearch(e.target.value)}
        className="pl-10"
      />
    </div>
  )
}
