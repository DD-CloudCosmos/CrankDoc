'use client'

import { useState } from 'react'
import { DtcSearch } from '@/components/DtcSearch'
import { DtcCodeCard } from '@/components/DtcCodeCard'
import type { DtcCode } from '@/types/database.types'

interface DtcCodeListProps {
  codes: DtcCode[]
}

export function DtcCodeList({ codes }: DtcCodeListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCodes = codes.filter((code) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      code.code.toLowerCase().includes(query) ||
      code.description.toLowerCase().includes(query) ||
      code.category?.toLowerCase().includes(query) ||
      code.common_causes?.some((cause) => cause.toLowerCase().includes(query))
    )
  })

  return (
    <div className="space-y-4">
      <DtcSearch onSearch={setSearchQuery} />

      {filteredCodes.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            {searchQuery ? 'No DTC codes match your search' : 'No DTC codes available'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredCodes.map((code) => (
            <DtcCodeCard key={code.id} dtcCode={code} />
          ))}
        </div>
      )}
    </div>
  )
}
