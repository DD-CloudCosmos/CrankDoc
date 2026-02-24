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
        variant={activeLetter === '' ? 'default' : 'outline'}
        size="sm"
        className={activeLetter === '' ? 'rounded-[999px] bg-[#1F1F1F] text-white' : 'rounded-[999px] bg-background text-foreground'}
        onClick={() => onChange('')}
      >
        All
      </Button>
      {LETTERS.map((letter) => (
        <Button
          key={letter}
          variant={activeLetter === letter ? 'default' : 'outline'}
          size="sm"
          className={activeLetter === letter ? 'rounded-[999px] bg-[#1F1F1F] text-white' : 'rounded-[999px] bg-background text-foreground'}
          onClick={() => onChange(letter)}
        >
          {letter}
        </Button>
      ))}
    </div>
  )
}
