'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { GroupedList, ListRow } from '@/components/ui/grouped-list'
import { SafetyBadge } from '@/components/SafetyBadge'
import { StepSkillNotice } from '@/components/SkillNotice'
import type { DecisionTreeData, DecisionTreeNode } from '@/types/database.types'
import { AlertTriangle, ChevronLeft, RotateCcw, ChevronRight, Wrench, CheckCircle } from 'lucide-react'

interface TreeWalkerProps {
  treeData: DecisionTreeData
  treeTitle: string
  /** Hide the title when the page already shows it as its h1 */
  showTitle?: boolean
}

/** Text of the option on `from` that leads to `toId`, used for the answers trail. */
function answerText(from: DecisionTreeNode | undefined, toId: string): string | null {
  if (!from) return null
  if (from.type === 'question') return from.options?.find((o) => o.next === toId)?.text ?? null
  // Check steps have a single "continue"; show what was checked
  return from.text
}

export function TreeWalker({ treeData, treeTitle, showTitle = true }: TreeWalkerProps) {
  const [history, setHistory] = useState<string[]>(['start'])

  const findNode = useCallback((id: string) => treeData.nodes.find((n) => n.id === id), [treeData])
  const currentNodeId = history[history.length - 1]
  const currentNode = findNode(currentNodeId)
  const stepNumber = history.length

  const navigateTo = useCallback((nodeId: string) => {
    setHistory((prev) => [...prev, nodeId])
  }, [])

  const goBack = useCallback(() => {
    setHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))
  }, [])

  const restart = useCallback(() => {
    setHistory(['start'])
  }, [])

  if (!currentNode) {
    return (
      <div className="rounded-[20px] bg-card p-8 text-center shadow-card">
        <p className="text-muted-foreground">Error: Could not find diagnostic step.</p>
        <Button onClick={restart} variant="secondary" className="mt-4">
          <RotateCcw />
          Start Over
        </Button>
      </div>
    )
  }

  const trail = history
    .slice(1)
    .map((id, index) => answerText(findNode(history[index]), id))
    .filter((text): text is string => Boolean(text))

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          {showTitle && <h2 className="text-[22px] font-semibold leading-tight tracking-[-0.02em]">{treeTitle}</h2>}
          <p className="mt-1 text-[15px] text-muted-foreground" aria-live="polite">
            Step {stepNumber}
          </p>
        </div>
        <SafetyBadge level={currentNode.safety} className="mt-1 shrink-0" />
      </div>

      {/* Answers so far */}
      {trail.length > 0 && (
        <GroupedList header="Your answers">
          {trail.map((text, index) => (
            <ListRow
              key={`${index}-${text}`}
              label={<span className="text-[15px]">{text}</span>}
              leading={<span aria-hidden="true" className="h-2 w-2 rounded-full bg-safe" />}
            />
          ))}
        </GroupedList>
      )}

      <StepSkillNotice safety={currentNode.safety} />

      {/* Safety Warning */}
      {currentNode.warning && (
        <div role="note" className="flex items-start gap-3 rounded-[14px] bg-caution-background p-4">
          <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-caution-foreground" />
          <p className="text-[15px] text-caution-foreground">{currentNode.warning}</p>
        </div>
      )}

      {/* Current step */}
      <section aria-labelledby="current-step" className="space-y-4">
        <h3 id="current-step" className="text-[28px] font-bold leading-tight tracking-[-0.022em]">
          {currentNode.text}
        </h3>

        {currentNode.type === 'question' && currentNode.options && (
          <GroupedList>
            {currentNode.options.map((option) => (
              <ListRow
                key={option.next}
                label={option.text}
                chevron
                onClick={() => navigateTo(option.next)}
              />
            ))}
          </GroupedList>
        )}

        {currentNode.type === 'check' && (
          <div className="space-y-4">
            {currentNode.instructions && (
              <p className="rounded-[20px] bg-card p-5 text-[17px] leading-relaxed text-foreground shadow-card">
                {currentNode.instructions}
              </p>
            )}
            {currentNode.next && (
              <Button onClick={() => navigateTo(currentNode.next!)} className="w-full rounded-[14px]">
                Continue
                <ChevronRight />
              </Button>
            )}
          </div>
        )}

        {currentNode.type === 'solution' && (
          <div className="space-y-4">
            {currentNode.action && (
              <div className="flex items-start gap-3 rounded-[20px] bg-card p-5 shadow-card">
                <Wrench aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p className="text-[17px] font-semibold">{currentNode.action}</p>
              </div>
            )}
            {currentNode.details && (
              <p className="text-[17px] leading-relaxed text-muted-foreground">{currentNode.details}</p>
            )}
            <div className="flex items-center gap-2 rounded-[14px] bg-safe-background p-3.5">
              <CheckCircle aria-hidden="true" className="h-5 w-5 text-safe-foreground" />
              <span className="text-[15px] font-medium text-safe-foreground">Diagnosis complete</span>
            </div>
          </div>
        )}
      </section>

      {/* Navigation */}
      <div className="flex flex-wrap gap-2">
        {history.length > 1 && (
          <Button variant="secondary" onClick={goBack}>
            <ChevronLeft />
            Back
          </Button>
        )}
        {currentNode.type === 'solution' && (
          <Button variant="secondary" onClick={restart}>
            <RotateCcw />
            Start Over
          </Button>
        )}
      </div>

      {/* Disclaimer */}
      <p className="text-[13px] text-muted-foreground">
        CrankDoc provides diagnostic guidance for educational reference only. Always follow manufacturer service manual procedures.
      </p>
    </div>
  )
}
