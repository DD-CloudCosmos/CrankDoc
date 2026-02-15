'use client'

import { useRouter } from 'next/navigation'
import { GenerationSelector } from '@/components/GenerationSelector'

interface GenerationItem {
  id: string
  generation: string | null
  year_start: number
  year_end: number | null
}

interface GenerationNavSelectorProps {
  generations: GenerationItem[]
  activeGenerationId: string
}

export function GenerationNavSelector({ generations, activeGenerationId }: GenerationNavSelectorProps) {
  const router = useRouter()

  function handleSelect(id: string) {
    router.push(`/bikes/${id}`)
  }

  return (
    <GenerationSelector
      generations={generations}
      activeGenerationId={activeGenerationId}
      onSelect={handleSelect}
    />
  )
}
