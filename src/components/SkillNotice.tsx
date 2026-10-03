'use client'

import { Info } from 'lucide-react'
import { useGarage } from '@/hooks/useGarage'
import { isStepAboveSkill, isTreeAboveSkill, type SafetyLevel, type TreeDifficulty } from '@/lib/garage'
import { cn } from '@/lib/utils'

/**
 * Shown on a diagnostic step whose safety rating is beyond the experience
 * level the user set in My Garage. The step itself stays visible: we flag,
 * we never hide.
 */
export function StepSkillNotice({ safety, className }: { safety: SafetyLevel; className?: string }) {
  const { garage } = useGarage()
  if (!garage || !isStepAboveSkill(safety, garage.skill)) return null

  return (
    <div role="note" className={cn('flex items-start gap-3 rounded-[14px] bg-secondary p-4', className)}>
      <Info aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      <p className="text-[15px] text-foreground">
        This step is above the experience level you set. Take your time with the warning, or hand this one to a professional.
      </p>
    </div>
  )
}

/** Small tag on a guide in the symptom list when its difficulty is above the user's level. */
export function TreeSkillFlag({ difficulty }: { difficulty: TreeDifficulty | null }) {
  const { garage } = useGarage()
  if (!garage || !isTreeAboveSkill(difficulty, garage.skill)) return null

  return (
    <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-[13px] font-medium text-muted-foreground">
      Above your level
    </span>
  )
}
