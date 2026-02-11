'use client'

import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface DtcSearchProps {
  onSearch: (query: string) => void
  defaultValue?: string
}

export function DtcSearch({ onSearch, defaultValue = '' }: DtcSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search DTC codes (e.g., P0301)"
        defaultValue={defaultValue}
        onChange={(e) => onSearch(e.target.value)}
        className="pl-10"
      />
    </div>
  )
}
