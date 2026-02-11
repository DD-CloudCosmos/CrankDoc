'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SafetyBadge } from '@/components/SafetyBadge'
import type { DecisionTreeData, DecisionTreeNode } from '@/types/database.types'
import { AlertTriangle, ArrowLeft, RotateCcw, ChevronRight, Wrench, CheckCircle } from 'lucide-react'

interface TreeWalkerProps {
  treeData: DecisionTreeData
  treeTitle: string
}

export function TreeWalker({ treeData, treeTitle }: TreeWalkerProps) {
  const [history, setHistory] = useState<string[]>(['start'])

  const currentNodeId = history[history.length - 1]
  const currentNode = treeData.nodes.find((n) => n.id === currentNodeId)
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
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Error: Could not find diagnostic step.</p>
          <Button onClick={restart} variant="outline" className="mt-4">
            <RotateCcw className="mr-2 h-4 w-4" />
            Start Over
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{treeTitle}</h2>
        <SafetyBadge level={currentNode.safety} />
      </div>

      {/* Progress */}
      <p className="text-sm text-muted-foreground">Step {stepNumber}</p>

      {/* Safety Warning */}
      {currentNode.warning && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-800 bg-yellow-900/30 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
          <p className="text-sm text-yellow-200">{currentNode.warning}</p>
        </div>
      )}

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{currentNode.text}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Question Node — show options */}
          {currentNode.type === 'question' && currentNode.options && (
            <div className="space-y-2">
              {currentNode.options.map((option) => (
                <Button
                  key={option.next}
                  variant="outline"
                  className="w-full justify-between text-left"
                  onClick={() => navigateTo(option.next)}
                >
                  <span>{option.text}</span>
                  <ChevronRight className="h-4 w-4 shrink-0" />
                </Button>
              ))}
            </div>
          )}

          {/* Check Node — show instructions + continue */}
          {currentNode.type === 'check' && (
            <div className="space-y-4">
              {currentNode.instructions && (
                <div className="rounded-lg bg-zinc-800/50 p-4">
                  <p className="text-sm text-zinc-300">{currentNode.instructions}</p>
                </div>
              )}
              {currentNode.next && (
                <Button onClick={() => navigateTo(currentNode.next!)} className="w-full">
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Solution Node — show action + details */}
          {currentNode.type === 'solution' && (
            <div className="space-y-4">
              {currentNode.action && (
                <div className="flex items-start gap-3 rounded-lg bg-zinc-800/50 p-4">
                  <Wrench className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">{currentNode.action}</p>
                  </div>
                </div>
              )}
              {currentNode.details && (
                <p className="text-sm text-muted-foreground">{currentNode.details}</p>
              )}
              <div className="flex items-center gap-2 rounded-lg border border-green-800 bg-green-900/20 p-3">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-sm text-green-300">Diagnosis complete</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex gap-2">
        {history.length > 1 && (
          <Button variant="outline" onClick={goBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
        {currentNode.type === 'solution' && (
          <Button variant="outline" onClick={restart}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Start Over
          </Button>
        )}
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground">
        CrankDoc provides diagnostic guidance for educational reference only. Always follow manufacturer service manual procedures.
      </p>
    </div>
  )
}
