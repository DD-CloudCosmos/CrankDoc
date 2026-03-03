'use client'

import { Button } from '@/components/ui/button'

interface GlossaryAlphaFilterProps {
  activeLetter: string
  onChange: (letter: string) => void
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export function GlossaryAlphaFilter({ activeLetter, onChange }: GlossaryAlphaFilterProps) {
  return (
    <div className="flex flex-nowrap gap-1 overflow-x-auto">
      <Button
        variant={activeLetter === '' ? 'pill-active' : 'pill'}
        size="sm"
        onClick={() => onChange('')}
      >
        All
      </Button>
      {LETTERS.map((letter) => (
        <Button
          key={letter}
          variant={activeLetter === letter ? 'pill-active' : 'pill'}
          size="sm"
          onClick={() => onChange(letter)}
        >
          {letter}
        </Button>
      ))}
    </div>
  )
}
