'use client'

import { Button } from '@/components/ui/button'

interface Generation {
  id: string
  generation: string | null
  year_start: number
  year_end: number | null
}

interface GenerationSelectorProps {
  generations: Generation[]
  activeGenerationId: string
  onSelect: (id: string) => void
}

function formatGenerationLabel(gen: Generation): string {
  if (gen.generation) {
    return gen.generation
  }
  return gen.year_end ? `${gen.year_start}-${gen.year_end}` : `${gen.year_start}-present`
}

export function GenerationSelector({ generations, activeGenerationId, onSelect }: GenerationSelectorProps) {
  if (generations.length <= 1) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2">
      {generations.map((gen) => (
        <Button
          key={gen.id}
          variant={activeGenerationId === gen.id ? 'default' : 'outline'}
          size="sm"
          className={
            activeGenerationId === gen.id
              ? 'rounded-[999px] bg-[#1F1F1F] text-white'
              : 'rounded-[999px] bg-background text-foreground'
          }
          onClick={() => onSelect(gen.id)}
        >
          {formatGenerationLabel(gen)}
        </Button>
      ))}
    </div>
  )
}
