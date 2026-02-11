# Phase 2: Diagnostic Engine — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the interactive diagnostic decision tree walker (the core product), DTC code lookup, and VIN decoder — turning CrankDoc from a motorcycle database into a diagnostic tool.

**Architecture:** Two parallel workstreams. Workstream A builds the diagnostic tree feature (/diagnose pages, TreeWalker component, bike detail integration). Workstream B builds DTC lookup and VIN decoder. Both are independent and can be built simultaneously by separate agents. All features are server-first (data fetching in Server Components) with client components only where interactivity is needed.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Supabase (existing client), TailwindCSS + shadcn/ui, Vitest + RTL for testing.

---

## Existing State (What's Already Built)

- **Database:** `motorcycles` (6 rows), `diagnostic_trees` (2 rows with full tree_data JSONB), `dtc_codes` (7 rows)
- **Types:** `src/types/database.types.ts` — `Motorcycle`, `DiagnosticTree`, `DtcCode`, `DecisionTreeNode`, `DecisionTreeData`
- **Supabase clients:** `createServerClient()` in `src/lib/supabase/server.ts`, `createClient()` in `src/lib/supabase/client.ts`
- **UI components:** Button, Card (with CardHeader/Title/Description/Content/Footer), Badge
- **Test patterns:** Vitest + RTL, mocked Supabase with `vi.mock('@/lib/supabase/server')`, async server components tested with `render(await Page({...}))`
- **Stub pages:** `/diagnose`, `/dtc`, `/vin` all exist as placeholder pages

### Tree Data Structure (in `diagnostic_trees.tree_data` JSONB)
```typescript
interface DecisionTreeNode {
  id: string                                    // unique node ID, first node is always "start"
  type: 'question' | 'check' | 'solution'       // question=branching, check=procedural step, solution=end
  text: string                                   // display text
  safety: 'green' | 'yellow' | 'red'            // safety level
  warning?: string                               // safety warning text
  instructions?: string                          // step instructions (for check nodes)
  options?: Array<{ text: string; next: string }> // branching options (for question nodes)
  next?: string                                  // next node (for check nodes, linear flow)
  action?: string                                // what to do (for solution nodes)
  details?: string                               // expanded details (for solution nodes)
}
```

---

## WORKSTREAM A: Diagnostic Tree Feature

### Task A1: Add shadcn/ui Input component

**Files:**
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/input.test.tsx`

**Step 1: Add the Input component**

Run: `npx shadcn@latest add input`

If that fails (it sometimes does with newer Next.js), manually create the file:

```tsx
// src/components/ui/input.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
```

**Step 2: Write tests**

```tsx
// src/components/ui/input.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Input } from './input'

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input placeholder="Search..." />)
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Input className="custom-class" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveClass('custom-class')
  })

  it('supports different types', () => {
    render(<Input type="email" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'email')
  })

  it('is disabled when disabled prop is true', () => {
    render(<Input disabled data-testid="input" />)
    expect(screen.getByTestId('input')).toBeDisabled()
  })
})
```

**Step 3: Run tests**

Run: `npx vitest run src/components/ui/input.test.tsx`
Expected: 4 tests PASS

**Step 4: Commit**
```bash
git add src/components/ui/input.tsx src/components/ui/input.test.tsx
git commit -m "feat: add shadcn/ui Input component with tests"
```

---

### Task A2: SafetyBadge component

A reusable component that shows safety level (green/yellow/red) with appropriate styling and labels.

**Files:**
- Create: `src/components/SafetyBadge.tsx`
- Create: `src/components/SafetyBadge.test.tsx`

**Step 1: Write the failing test**

```tsx
// src/components/SafetyBadge.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SafetyBadge } from './SafetyBadge'

describe('SafetyBadge', () => {
  it('renders green safety level as "Beginner Safe"', () => {
    render(<SafetyBadge level="green" />)
    expect(screen.getByText('Beginner Safe')).toBeInTheDocument()
  })

  it('renders yellow safety level as "Use Caution"', () => {
    render(<SafetyBadge level="yellow" />)
    expect(screen.getByText('Use Caution')).toBeInTheDocument()
  })

  it('renders red safety level as "Professional Recommended"', () => {
    render(<SafetyBadge level="red" />)
    expect(screen.getByText('Professional Recommended')).toBeInTheDocument()
  })

  it('applies green styling for green level', () => {
    render(<SafetyBadge level="green" />)
    const badge = screen.getByText('Beginner Safe')
    expect(badge.className).toContain('green')
  })

  it('applies yellow styling for yellow level', () => {
    render(<SafetyBadge level="yellow" />)
    const badge = screen.getByText('Use Caution')
    expect(badge.className).toContain('yellow')
  })

  it('applies red styling for red level', () => {
    render(<SafetyBadge level="red" />)
    const badge = screen.getByText('Professional Recommended')
    expect(badge.className).toContain('red')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/SafetyBadge.test.tsx`
Expected: FAIL — module not found

**Step 3: Write implementation**

```tsx
// src/components/SafetyBadge.tsx
import { cn } from '@/lib/utils'

interface SafetyBadgeProps {
  level: 'green' | 'yellow' | 'red'
  className?: string
}

const safetyConfig = {
  green: {
    label: 'Beginner Safe',
    className: 'bg-green-900/50 text-green-400 border-green-800',
  },
  yellow: {
    label: 'Use Caution',
    className: 'bg-yellow-900/50 text-yellow-400 border-yellow-800',
  },
  red: {
    label: 'Professional Recommended',
    className: 'bg-red-900/50 text-red-400 border-red-800',
  },
} as const

export function SafetyBadge({ level, className }: SafetyBadgeProps) {
  const config = safetyConfig[level]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
```

**Step 4: Run tests**

Run: `npx vitest run src/components/SafetyBadge.test.tsx`
Expected: 6 tests PASS

**Step 5: Commit**
```bash
git add src/components/SafetyBadge.tsx src/components/SafetyBadge.test.tsx
git commit -m "feat: add SafetyBadge component for diagnostic safety levels"
```

---

### Task A3: TreeWalker client component (THE CORE)

The interactive decision tree navigation component. This is the heart of the entire app.

**Files:**
- Create: `src/components/TreeWalker.tsx`
- Create: `src/components/TreeWalker.test.tsx`

**Step 1: Write the failing tests**

```tsx
// src/components/TreeWalker.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TreeWalker } from './TreeWalker'
import type { DecisionTreeData } from '@/types/database.types'

const mockTreeData: DecisionTreeData = {
  nodes: [
    {
      id: 'start',
      type: 'question',
      text: 'Does the engine turn over?',
      safety: 'green',
      options: [
        { text: 'Yes, it cranks', next: 'cranks' },
        { text: 'No, nothing happens', next: 'no_crank' },
      ],
    },
    {
      id: 'cranks',
      type: 'check',
      text: 'Check battery voltage',
      safety: 'green',
      instructions: 'Use a multimeter to measure battery voltage.',
      next: 'battery_result',
    },
    {
      id: 'no_crank',
      type: 'solution',
      text: 'Dead battery',
      safety: 'green',
      action: 'Charge or replace battery',
      details: 'Connect a battery charger or replace the battery.',
    },
    {
      id: 'battery_result',
      type: 'question',
      text: 'What is the voltage?',
      safety: 'yellow',
      warning: 'Be careful with electrical components.',
      options: [
        { text: 'Below 12V', next: 'low_battery' },
        { text: 'Above 12V', next: 'good_battery' },
      ],
    },
    {
      id: 'low_battery',
      type: 'solution',
      text: 'Low battery charge',
      safety: 'green',
      action: 'Charge battery',
      details: 'Use a battery tender to charge.',
    },
    {
      id: 'good_battery',
      type: 'solution',
      text: 'Battery is fine - check starter',
      safety: 'yellow',
      action: 'Inspect starter motor',
      details: 'Test starter relay and motor.',
    },
  ],
}

describe('TreeWalker', () => {
  it('renders the first node (start) on mount', () => {
    render(<TreeWalker treeData={mockTreeData} treeTitle="Engine Won't Start" />)
    expect(screen.getByText("Does the engine turn over?")).toBeInTheDocument()
  })

  it('displays options for question nodes', () => {
    render(<TreeWalker treeData={mockTreeData} treeTitle="Engine Won't Start" />)
    expect(screen.getByText('Yes, it cranks')).toBeInTheDocument()
    expect(screen.getByText('No, nothing happens')).toBeInTheDocument()
  })

  it('navigates to next node when option is clicked', async () => {
    const user = userEvent.setup()
    render(<TreeWalker treeData={mockTreeData} treeTitle="Engine Won't Start" />)

    await user.click(screen.getByText('No, nothing happens'))

    expect(screen.getByText('Dead battery')).toBeInTheDocument()
    expect(screen.getByText('Charge or replace battery')).toBeInTheDocument()
  })

  it('shows instructions for check nodes', async () => {
    const user = userEvent.setup()
    render(<TreeWalker treeData={mockTreeData} treeTitle="Engine Won't Start" />)

    await user.click(screen.getByText('Yes, it cranks'))

    expect(screen.getByText('Check battery voltage')).toBeInTheDocument()
    expect(screen.getByText('Use a multimeter to measure battery voltage.')).toBeInTheDocument()
  })

  it('shows continue button for check nodes', async () => {
    const user = userEvent.setup()
    render(<TreeWalker treeData={mockTreeData} treeTitle="Engine Won't Start" />)

    await user.click(screen.getByText('Yes, it cranks'))

    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
  })

  it('navigates from check node to next node on continue', async () => {
    const user = userEvent.setup()
    render(<TreeWalker treeData={mockTreeData} treeTitle="Engine Won't Start" />)

    await user.click(screen.getByText('Yes, it cranks'))
    await user.click(screen.getByRole('button', { name: /continue/i }))

    expect(screen.getByText('What is the voltage?')).toBeInTheDocument()
  })

  it('displays safety warning when present', async () => {
    const user = userEvent.setup()
    render(<TreeWalker treeData={mockTreeData} treeTitle="Engine Won't Start" />)

    await user.click(screen.getByText('Yes, it cranks'))
    await user.click(screen.getByRole('button', { name: /continue/i }))

    expect(screen.getByText('Be careful with electrical components.')).toBeInTheDocument()
  })

  it('shows solution details for solution nodes', async () => {
    const user = userEvent.setup()
    render(<TreeWalker treeData={mockTreeData} treeTitle="Engine Won't Start" />)

    await user.click(screen.getByText('No, nothing happens'))

    expect(screen.getByText('Dead battery')).toBeInTheDocument()
    expect(screen.getByText('Charge or replace battery')).toBeInTheDocument()
    expect(screen.getByText('Connect a battery charger or replace the battery.')).toBeInTheDocument()
  })

  it('shows back button after navigating away from start', async () => {
    const user = userEvent.setup()
    render(<TreeWalker treeData={mockTreeData} treeTitle="Engine Won't Start" />)

    await user.click(screen.getByText('No, nothing happens'))

    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
  })

  it('navigates back to previous node when back button is clicked', async () => {
    const user = userEvent.setup()
    render(<TreeWalker treeData={mockTreeData} treeTitle="Engine Won't Start" />)

    await user.click(screen.getByText('No, nothing happens'))
    await user.click(screen.getByRole('button', { name: /back/i }))

    expect(screen.getByText('Does the engine turn over?')).toBeInTheDocument()
  })

  it('shows restart button on solution nodes', async () => {
    const user = userEvent.setup()
    render(<TreeWalker treeData={mockTreeData} treeTitle="Engine Won't Start" />)

    await user.click(screen.getByText('No, nothing happens'))

    expect(screen.getByRole('button', { name: /start over/i })).toBeInTheDocument()
  })

  it('restarts tree when restart button is clicked', async () => {
    const user = userEvent.setup()
    render(<TreeWalker treeData={mockTreeData} treeTitle="Engine Won't Start" />)

    await user.click(screen.getByText('No, nothing happens'))
    await user.click(screen.getByRole('button', { name: /start over/i }))

    expect(screen.getByText('Does the engine turn over?')).toBeInTheDocument()
  })

  it('shows step counter (progress)', async () => {
    const user = userEvent.setup()
    render(<TreeWalker treeData={mockTreeData} treeTitle="Engine Won't Start" />)

    expect(screen.getByText(/step 1/i)).toBeInTheDocument()

    await user.click(screen.getByText('No, nothing happens'))

    expect(screen.getByText(/step 2/i)).toBeInTheDocument()
  })

  it('displays the tree title', () => {
    render(<TreeWalker treeData={mockTreeData} treeTitle="Engine Won't Start" />)
    expect(screen.getByText("Engine Won't Start")).toBeInTheDocument()
  })

  it('displays safety badge for current node', () => {
    render(<TreeWalker treeData={mockTreeData} treeTitle="Engine Won't Start" />)
    expect(screen.getByText('Beginner Safe')).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/TreeWalker.test.tsx`
Expected: FAIL

**Step 3: Write implementation**

```tsx
// src/components/TreeWalker.tsx
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
```

**Step 4: Run tests**

Run: `npx vitest run src/components/TreeWalker.test.tsx`
Expected: All 15 tests PASS

**Step 5: Commit**
```bash
git add src/components/TreeWalker.tsx src/components/TreeWalker.test.tsx
git commit -m "feat: add TreeWalker interactive diagnostic component"
```

---

### Task A4: DiagnosticTreeCard component

Card to display a diagnostic tree in list views (used on /diagnose and /bikes/[id]).

**Files:**
- Create: `src/components/DiagnosticTreeCard.tsx`
- Create: `src/components/DiagnosticTreeCard.test.tsx`

**Step 1: Write the failing test**

```tsx
// src/components/DiagnosticTreeCard.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DiagnosticTreeCard } from './DiagnosticTreeCard'
import type { DiagnosticTree } from '@/types/database.types'

describe('DiagnosticTreeCard', () => {
  const mockTree: DiagnosticTree = {
    id: 'tree-1',
    motorcycle_id: 'moto-1',
    title: "Engine Won't Start",
    description: 'Systematic diagnosis for a non-starting engine.',
    category: 'electrical',
    difficulty: 'beginner',
    tree_data: { nodes: [] },
    created_at: '2024-01-01T00:00:00Z',
  }

  it('renders the tree title', () => {
    render(<DiagnosticTreeCard tree={mockTree} />)
    expect(screen.getByText("Engine Won't Start")).toBeInTheDocument()
  })

  it('renders the tree description', () => {
    render(<DiagnosticTreeCard tree={mockTree} />)
    expect(screen.getByText('Systematic diagnosis for a non-starting engine.')).toBeInTheDocument()
  })

  it('renders the difficulty badge', () => {
    render(<DiagnosticTreeCard tree={mockTree} />)
    expect(screen.getByText(/beginner/i)).toBeInTheDocument()
  })

  it('renders the category', () => {
    render(<DiagnosticTreeCard tree={mockTree} />)
    expect(screen.getByText(/electrical/i)).toBeInTheDocument()
  })

  it('renders as a link to the diagnose page', () => {
    render(<DiagnosticTreeCard tree={mockTree} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/diagnose/tree-1')
  })

  it('handles null description gracefully', () => {
    const treeNoDesc = { ...mockTree, description: null }
    render(<DiagnosticTreeCard tree={treeNoDesc} />)
    expect(screen.getByText("Engine Won't Start")).toBeInTheDocument()
  })

  it('handles null difficulty gracefully', () => {
    const treeNoDiff = { ...mockTree, difficulty: null }
    render(<DiagnosticTreeCard tree={treeNoDiff} />)
    expect(screen.getByText("Engine Won't Start")).toBeInTheDocument()
  })

  it('optionally shows motorcycle name', () => {
    render(<DiagnosticTreeCard tree={mockTree} motorcycleName="Honda CBR600RR" />)
    expect(screen.getByText('Honda CBR600RR')).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/DiagnosticTreeCard.test.tsx`
Expected: FAIL

**Step 3: Write implementation**

```tsx
// src/components/DiagnosticTreeCard.tsx
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { DiagnosticTree } from '@/types/database.types'
import { ChevronRight } from 'lucide-react'

interface DiagnosticTreeCardProps {
  tree: DiagnosticTree
  motorcycleName?: string
}

const difficultyVariant = (difficulty: string | null) => {
  switch (difficulty) {
    case 'beginner':
      return 'secondary'
    case 'intermediate':
      return 'default'
    case 'advanced':
      return 'destructive'
    default:
      return 'outline'
  }
}

export function DiagnosticTreeCard({ tree, motorcycleName }: DiagnosticTreeCardProps) {
  return (
    <Link href={`/diagnose/${tree.id}`}>
      <Card className="transition-colors hover:bg-accent">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">{tree.title}</CardTitle>
            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
          {tree.description && (
            <CardDescription>{tree.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {tree.difficulty && (
              <Badge variant={difficultyVariant(tree.difficulty)}>
                {tree.difficulty}
              </Badge>
            )}
            {tree.category && (
              <Badge variant="outline">
                {tree.category}
              </Badge>
            )}
            {motorcycleName && (
              <span className="text-xs text-muted-foreground">{motorcycleName}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
```

**Step 4: Run tests**

Run: `npx vitest run src/components/DiagnosticTreeCard.test.tsx`
Expected: 8 tests PASS

**Step 5: Commit**
```bash
git add src/components/DiagnosticTreeCard.tsx src/components/DiagnosticTreeCard.test.tsx
git commit -m "feat: add DiagnosticTreeCard component for tree listings"
```

---

### Task A5: /diagnose page — diagnostic tree listing

Replace the stub `/diagnose` page with a real page that lists all diagnostic trees from Supabase.

**Files:**
- Modify: `src/app/diagnose/page.tsx`
- Create: `src/app/diagnose/page.test.tsx`

**Step 1: Write the failing test**

```tsx
// src/app/diagnose/page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import DiagnosePage from './page'
import { createServerClient } from '@/lib/supabase/server'
import type { DiagnosticTree } from '@/types/database.types'

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}))

describe('DiagnosePage', () => {
  const mockTrees: DiagnosticTree[] = [
    {
      id: 'tree-1',
      motorcycle_id: 'moto-1',
      title: "Engine Won't Start",
      description: 'Diagnosis for non-starting engine.',
      category: 'electrical',
      difficulty: 'beginner',
      tree_data: { nodes: [] },
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'tree-2',
      motorcycle_id: 'moto-2',
      title: "Won't Idle / Stalls",
      description: 'Diagnose idle issues.',
      category: 'fuel',
      difficulty: 'intermediate',
      tree_data: { nodes: [] },
      created_at: '2024-01-01T00:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the page title', async () => {
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            data: mockTrees,
            error: null,
          })),
        })),
      })),
    }
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await DiagnosePage())
    expect(screen.getByRole('heading', { name: /diagnostic trees/i, level: 1 })).toBeInTheDocument()
  })

  it('displays diagnostic trees when data is loaded', async () => {
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            data: mockTrees,
            error: null,
          })),
        })),
      })),
    }
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await DiagnosePage())
    expect(screen.getByText("Engine Won't Start")).toBeInTheDocument()
    expect(screen.getByText("Won't Idle / Stalls")).toBeInTheDocument()
  })

  it('displays empty state when no trees exist', async () => {
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
    }
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await DiagnosePage())
    expect(screen.getByText(/no diagnostic trees available/i)).toBeInTheDocument()
  })

  it('displays error message when query fails', async () => {
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            data: null,
            error: { message: 'Query failed' },
          })),
        })),
      })),
    }
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await DiagnosePage())
    expect(screen.getByText(/error loading diagnostic trees/i)).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/diagnose/page.test.tsx`
Expected: FAIL

**Step 3: Replace the stub page**

```tsx
// src/app/diagnose/page.tsx
import { createServerClient } from '@/lib/supabase/server'
import { DiagnosticTreeCard } from '@/components/DiagnosticTreeCard'
import type { DiagnosticTree } from '@/types/database.types'

async function getDiagnosticTrees(): Promise<{ data: DiagnosticTree[] | null; error: string | null }> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('diagnostic_trees')
    .select('*')
    .order('title')

  if (error) {
    console.error('Error fetching diagnostic trees:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export default async function DiagnosePage() {
  const { data: trees, error } = await getDiagnosticTrees()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold">Diagnostic Trees</h1>
        <p className="text-muted-foreground">
          Step-by-step troubleshooting for common motorcycle issues
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-8 text-center">
          <p className="text-red-400">Error loading diagnostic trees</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Failed to fetch diagnostic trees from database. Please try again later.
          </p>
        </div>
      )}

      {!error && trees && trees.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-lg text-muted-foreground">
            No diagnostic trees available yet
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Check back soon as we add troubleshooting guides.
          </p>
        </div>
      )}

      {!error && trees && trees.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trees.map((tree) => (
            <DiagnosticTreeCard key={tree.id} tree={tree} />
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 4: Run tests**

Run: `npx vitest run src/app/diagnose/page.test.tsx`
Expected: 4 tests PASS

**Step 5: Commit**
```bash
git add src/app/diagnose/page.tsx src/app/diagnose/page.test.tsx
git commit -m "feat: build /diagnose page with tree listing"
```

---

### Task A6: /diagnose/[treeId] page — tree walker page

Dynamic route that fetches a specific tree and renders the TreeWalker.

**Files:**
- Create: `src/app/diagnose/[treeId]/page.tsx`
- Create: `src/app/diagnose/[treeId]/page.test.tsx`
- Create: `src/app/diagnose/[treeId]/not-found.tsx`

**Step 1: Write the failing test**

```tsx
// src/app/diagnose/[treeId]/page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import DiagnoseTreePage from './page'
import { createServerClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}))

const mockTreeRow = {
  id: 'tree-1',
  motorcycle_id: 'moto-1',
  title: "Engine Won't Start",
  description: 'Diagnosis for non-starting engine.',
  category: 'electrical',
  difficulty: 'beginner',
  tree_data: {
    nodes: [
      {
        id: 'start',
        type: 'question',
        text: 'Does the engine turn over?',
        safety: 'green',
        options: [
          { text: 'Yes', next: 'solution1' },
          { text: 'No', next: 'solution2' },
        ],
      },
      {
        id: 'solution1',
        type: 'solution',
        text: 'Check spark plugs',
        safety: 'yellow',
        action: 'Replace spark plugs',
        details: 'Remove and inspect spark plugs.',
      },
      {
        id: 'solution2',
        type: 'solution',
        text: 'Check battery',
        safety: 'green',
        action: 'Charge battery',
        details: 'Use a battery charger.',
      },
    ],
  },
  created_at: '2024-01-01T00:00:00Z',
}

const mockMotorcycle = {
  id: 'moto-1',
  make: 'Honda',
  model: 'CBR600RR',
}

describe('DiagnoseTreePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the tree title and description', async () => {
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === 'diagnostic_trees') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: mockTreeRow,
                  error: null,
                })),
              })),
            })),
          }
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: mockMotorcycle,
                error: null,
              })),
            })),
          })),
        }
      }),
    }
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await DiagnoseTreePage({ params: Promise.resolve({ treeId: 'tree-1' }) }))
    expect(screen.getByText("Engine Won't Start")).toBeInTheDocument()
    expect(screen.getByText('Diagnosis for non-starting engine.')).toBeInTheDocument()
  })

  it('renders the TreeWalker with the first node', async () => {
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === 'diagnostic_trees') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: mockTreeRow,
                  error: null,
                })),
              })),
            })),
          }
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: mockMotorcycle,
                error: null,
              })),
            })),
          })),
        }
      }),
    }
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await DiagnoseTreePage({ params: Promise.resolve({ treeId: 'tree-1' }) }))
    expect(screen.getByText('Does the engine turn over?')).toBeInTheDocument()
    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
  })

  it('shows motorcycle name when motorcycle exists', async () => {
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === 'diagnostic_trees') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: mockTreeRow,
                  error: null,
                })),
              })),
            })),
          }
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: mockMotorcycle,
                error: null,
              })),
            })),
          })),
        }
      }),
    }
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await DiagnoseTreePage({ params: Promise.resolve({ treeId: 'tree-1' }) }))
    expect(screen.getByText(/Honda CBR600RR/)).toBeInTheDocument()
  })
})
```

**Step 2: Write the page and not-found**

```tsx
// src/app/diagnose/[treeId]/page.tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { TreeWalker } from '@/components/TreeWalker'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { DecisionTreeData } from '@/types/database.types'

interface PageProps {
  params: Promise<{ treeId: string }>
}

export default async function DiagnoseTreePage({ params }: PageProps) {
  const { treeId } = await params
  const supabase = createServerClient()

  const { data: tree, error } = await supabase
    .from('diagnostic_trees')
    .select('*')
    .eq('id', treeId)
    .single()

  if (error || !tree) {
    notFound()
  }

  // Fetch motorcycle name if tree is linked to one
  let motorcycleName: string | null = null
  if (tree.motorcycle_id) {
    const { data: motorcycle } = await supabase
      .from('motorcycles')
      .select('make, model')
      .eq('id', tree.motorcycle_id)
      .single()

    if (motorcycle) {
      motorcycleName = `${motorcycle.make} ${motorcycle.model}`
    }
  }

  const treeData = tree.tree_data as unknown as DecisionTreeData

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/diagnose">
          <Button variant="ghost" size="sm" className="mb-4">
            ← Back to all diagnostics
          </Button>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {motorcycleName && (
            <span className="text-sm text-muted-foreground">{motorcycleName}</span>
          )}
          {tree.difficulty && (
            <Badge variant="outline">{tree.difficulty}</Badge>
          )}
          {tree.category && (
            <Badge variant="outline">{tree.category}</Badge>
          )}
        </div>
        {tree.description && (
          <p className="mt-2 text-muted-foreground">{tree.description}</p>
        )}
      </div>

      <TreeWalker treeData={treeData} treeTitle={tree.title} />
    </div>
  )
}
```

```tsx
// src/app/diagnose/[treeId]/not-found.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="mb-4 text-3xl font-bold">Diagnostic Tree Not Found</h1>
      <p className="mb-8 text-muted-foreground">
        The diagnostic tree you&apos;re looking for doesn&apos;t exist or has been removed.
      </p>
      <Link href="/diagnose">
        <Button>Browse All Diagnostics</Button>
      </Link>
    </div>
  )
}
```

**Step 3: Run tests**

Run: `npx vitest run src/app/diagnose/[treeId]/page.test.tsx`
Expected: 3 tests PASS

**Step 4: Commit**
```bash
git add src/app/diagnose/[treeId]/
git commit -m "feat: add /diagnose/[treeId] page with tree walker"
```

---

### Task A7: Update bike detail page to show diagnostic trees

Replace the placeholder "Diagnostic Trees" card on `/bikes/[id]` with actual tree data.

**Files:**
- Modify: `src/app/bikes/[id]/page.tsx`

**Step 1: Update the page**

In `src/app/bikes/[id]/page.tsx`:
- Add a `getDiagnosticTrees(motorcycleId)` async function
- Import `DiagnosticTreeCard`
- Replace the placeholder card content with actual tree cards or "no trees" message

The key changes:
1. Add after the `getMotorcycle` function:
```typescript
async function getDiagnosticTrees(motorcycleId: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('diagnostic_trees')
    .select('*')
    .eq('motorcycle_id', motorcycleId)
    .order('title')

  if (error) {
    console.error('Error fetching diagnostic trees:', error)
    return []
  }
  return data ?? []
}
```

2. In the component, call `const trees = await getDiagnosticTrees(motorcycle.id)`

3. Replace the placeholder "No diagnostic trees" div with:
```tsx
{trees.length === 0 ? (
  <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8 text-center">
    <p className="text-muted-foreground">No diagnostic trees available yet for this model.</p>
    <p className="mt-2 text-sm text-muted-foreground">Check back soon as we add more diagnostic guides.</p>
  </div>
) : (
  <div className="space-y-3">
    {trees.map((tree) => (
      <DiagnosticTreeCard key={tree.id} tree={tree} />
    ))}
  </div>
)}
```

**Step 2: Run all tests**

Run: `npx vitest run`
Expected: All tests pass (existing bike page tests still pass, new tests pass)

**Step 3: Commit**
```bash
git add src/app/bikes/[id]/page.tsx
git commit -m "feat: show diagnostic trees on bike detail pages"
```

---

## WORKSTREAM B: DTC Lookup + VIN Decoder

### Task B1: DTC search component + /dtc page

**Files:**
- Create: `src/components/DtcSearch.tsx`
- Create: `src/components/DtcSearch.test.tsx`
- Create: `src/components/DtcCodeCard.tsx`
- Create: `src/components/DtcCodeCard.test.tsx`
- Modify: `src/app/dtc/page.tsx`
- Create: `src/app/dtc/page.test.tsx`

**Step 1: Write DtcCodeCard test**

```tsx
// src/components/DtcCodeCard.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DtcCodeCard } from './DtcCodeCard'
import type { DtcCode } from '@/types/database.types'

describe('DtcCodeCard', () => {
  const mockCode: DtcCode = {
    id: '1',
    code: 'P0301',
    description: 'Cylinder 1 Misfire Detected',
    category: 'powertrain',
    common_causes: ['Faulty spark plug', 'Ignition coil failure'],
    created_at: '2024-01-01T00:00:00Z',
  }

  it('renders the DTC code', () => {
    render(<DtcCodeCard dtcCode={mockCode} />)
    expect(screen.getByText('P0301')).toBeInTheDocument()
  })

  it('renders the description', () => {
    render(<DtcCodeCard dtcCode={mockCode} />)
    expect(screen.getByText('Cylinder 1 Misfire Detected')).toBeInTheDocument()
  })

  it('renders common causes', () => {
    render(<DtcCodeCard dtcCode={mockCode} />)
    expect(screen.getByText('Faulty spark plug')).toBeInTheDocument()
    expect(screen.getByText('Ignition coil failure')).toBeInTheDocument()
  })

  it('renders the category badge', () => {
    render(<DtcCodeCard dtcCode={mockCode} />)
    expect(screen.getByText(/powertrain/i)).toBeInTheDocument()
  })

  it('handles null common_causes', () => {
    const codeNoCauses = { ...mockCode, common_causes: null }
    render(<DtcCodeCard dtcCode={codeNoCauses} />)
    expect(screen.getByText('P0301')).toBeInTheDocument()
  })

  it('handles null category', () => {
    const codeNoCategory = { ...mockCode, category: null }
    render(<DtcCodeCard dtcCode={codeNoCategory} />)
    expect(screen.getByText('P0301')).toBeInTheDocument()
  })
})
```

**Step 2: Write DtcCodeCard implementation**

```tsx
// src/components/DtcCodeCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { DtcCode } from '@/types/database.types'

interface DtcCodeCardProps {
  dtcCode: DtcCode
}

export function DtcCodeCard({ dtcCode }: DtcCodeCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="font-mono text-lg">{dtcCode.code}</CardTitle>
          {dtcCode.category && (
            <Badge variant="outline">{dtcCode.category}</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{dtcCode.description}</p>
      </CardHeader>
      {dtcCode.common_causes && dtcCode.common_causes.length > 0 && (
        <CardContent>
          <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
            Common Causes
          </p>
          <ul className="space-y-1">
            {dtcCode.common_causes.map((cause) => (
              <li key={cause} className="text-sm text-zinc-300">
                {cause}
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  )
}
```

**Step 3: Write DtcSearch test**

```tsx
// src/components/DtcSearch.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DtcSearch } from './DtcSearch'

describe('DtcSearch', () => {
  it('renders a search input', () => {
    render(<DtcSearch onSearch={vi.fn()} />)
    expect(screen.getByPlaceholderText(/search dtc codes/i)).toBeInTheDocument()
  })

  it('calls onSearch when user types', async () => {
    const onSearch = vi.fn()
    const user = userEvent.setup()
    render(<DtcSearch onSearch={onSearch} />)

    await user.type(screen.getByPlaceholderText(/search dtc codes/i), 'P03')
    expect(onSearch).toHaveBeenCalledWith('P03')
  })
})
```

**Step 4: Write DtcSearch implementation**

```tsx
// src/components/DtcSearch.tsx
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
```

**Step 5: Write /dtc page test**

```tsx
// src/app/dtc/page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import DtcPage from './page'
import { createServerClient } from '@/lib/supabase/server'
import type { DtcCode } from '@/types/database.types'

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}))

describe('DtcPage', () => {
  const mockCodes: DtcCode[] = [
    {
      id: '1',
      code: 'P0301',
      description: 'Cylinder 1 Misfire Detected',
      category: 'powertrain',
      common_causes: ['Faulty spark plug'],
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      code: 'P0562',
      description: 'System Voltage Low',
      category: 'powertrain',
      common_causes: ['Weak battery'],
      created_at: '2024-01-01T00:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the page title', async () => {
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            data: mockCodes,
            error: null,
          })),
        })),
      })),
    }
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await DtcPage())
    expect(screen.getByRole('heading', { name: /dtc lookup/i, level: 1 })).toBeInTheDocument()
  })

  it('displays DTC codes', async () => {
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            data: mockCodes,
            error: null,
          })),
        })),
      })),
    }
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await DtcPage())
    expect(screen.getByText('P0301')).toBeInTheDocument()
    expect(screen.getByText('P0562')).toBeInTheDocument()
  })

  it('displays error state when query fails', async () => {
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            data: null,
            error: { message: 'Failed' },
          })),
        })),
      })),
    }
    vi.mocked(createServerClient).mockReturnValue(mockClient as never)

    render(await DtcPage())
    expect(screen.getByText(/error loading dtc codes/i)).toBeInTheDocument()
  })
})
```

**Step 6: Replace the stub /dtc page**

```tsx
// src/app/dtc/page.tsx
import { createServerClient } from '@/lib/supabase/server'
import { DtcCodeCard } from '@/components/DtcCodeCard'
import { DtcCodeList } from '@/components/DtcCodeList'
import type { DtcCode } from '@/types/database.types'

async function getDtcCodes(): Promise<{ data: DtcCode[] | null; error: string | null }> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('dtc_codes')
    .select('*')
    .order('code')

  if (error) {
    console.error('Error fetching DTC codes:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export default async function DtcPage() {
  const { data: codes, error } = await getDtcCodes()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold">DTC Lookup</h1>
        <p className="text-muted-foreground">
          Search Diagnostic Trouble Codes by code number or description
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-8 text-center">
          <p className="text-red-400">Error loading DTC codes</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Failed to fetch DTC codes from database. Please try again later.
          </p>
        </div>
      )}

      {!error && codes && (
        <DtcCodeList codes={codes} />
      )}
    </div>
  )
}
```

**Note:** The DTC page needs a client wrapper for search filtering. Create `DtcCodeList`:

```tsx
// src/components/DtcCodeList.tsx
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
```

Also add a test for DtcCodeList:

```tsx
// src/components/DtcCodeList.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DtcCodeList } from './DtcCodeList'
import type { DtcCode } from '@/types/database.types'

const mockCodes: DtcCode[] = [
  {
    id: '1',
    code: 'P0301',
    description: 'Cylinder 1 Misfire Detected',
    category: 'powertrain',
    common_causes: ['Faulty spark plug'],
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    code: 'C1234',
    description: 'ABS Wheel Speed Sensor',
    category: 'chassis',
    common_causes: ['Faulty sensor'],
    created_at: '2024-01-01T00:00:00Z',
  },
]

describe('DtcCodeList', () => {
  it('renders all codes when no search query', () => {
    render(<DtcCodeList codes={mockCodes} />)
    expect(screen.getByText('P0301')).toBeInTheDocument()
    expect(screen.getByText('C1234')).toBeInTheDocument()
  })

  it('filters codes by code number', async () => {
    const user = userEvent.setup()
    render(<DtcCodeList codes={mockCodes} />)

    await user.type(screen.getByPlaceholderText(/search dtc codes/i), 'P03')
    expect(screen.getByText('P0301')).toBeInTheDocument()
    expect(screen.queryByText('C1234')).not.toBeInTheDocument()
  })

  it('filters codes by description', async () => {
    const user = userEvent.setup()
    render(<DtcCodeList codes={mockCodes} />)

    await user.type(screen.getByPlaceholderText(/search dtc codes/i), 'ABS')
    expect(screen.queryByText('P0301')).not.toBeInTheDocument()
    expect(screen.getByText('C1234')).toBeInTheDocument()
  })

  it('shows empty state when no codes match', async () => {
    const user = userEvent.setup()
    render(<DtcCodeList codes={mockCodes} />)

    await user.type(screen.getByPlaceholderText(/search dtc codes/i), 'ZZZZZ')
    expect(screen.getByText(/no dtc codes match your search/i)).toBeInTheDocument()
  })

  it('shows empty state when codes array is empty', () => {
    render(<DtcCodeList codes={[]} />)
    expect(screen.getByText(/no dtc codes available/i)).toBeInTheDocument()
  })
})
```

**Step 7: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

**Step 8: Commit**
```bash
git add src/components/DtcCodeCard.tsx src/components/DtcCodeCard.test.tsx \
  src/components/DtcSearch.tsx src/components/DtcSearch.test.tsx \
  src/components/DtcCodeList.tsx src/components/DtcCodeList.test.tsx \
  src/app/dtc/page.tsx src/app/dtc/page.test.tsx
git commit -m "feat: build DTC code lookup with search functionality"
```

---

### Task B2: VIN Decoder API route + page

**Files:**
- Create: `src/app/api/vin/route.ts`
- Create: `src/app/api/vin/route.test.ts`
- Create: `src/components/VinDecoder.tsx`
- Create: `src/components/VinDecoder.test.tsx`
- Modify: `src/app/vin/page.tsx`
- Create: `src/app/vin/page.test.tsx`

**Step 1: VIN types**

Add to `src/types/database.types.ts` (append at end):

```typescript
// VIN decoder types (NHTSA vPIC API response)
export interface VinDecodedResult {
  make: string | null
  model: string | null
  year: number | null
  vehicleType: string | null
  engineSize: string | null
  fuelType: string | null
  displacement: string | null
  cylinders: string | null
  transmissionType: string | null
  errorCode: string | null
  errorText: string | null
}
```

**Step 2: Write API route test**

```typescript
// src/app/api/vin/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('GET /api/vin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when VIN parameter is missing', async () => {
    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/vin')
    const response = await GET(request)
    expect(response.status).toBe(400)
  })

  it('returns 400 when VIN is not 17 characters', async () => {
    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/vin?vin=TOOSMALL')
    const response = await GET(request)
    expect(response.status).toBe(400)
  })

  it('returns decoded VIN data on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        Results: [
          { Variable: 'Make', Value: 'Honda' },
          { Variable: 'Model', Value: 'CBR600RR' },
          { Variable: 'Model Year', Value: '2020' },
          { Variable: 'Vehicle Type', Value: 'MOTORCYCLE' },
          { Variable: 'Displacement (L)', Value: '0.599' },
          { Variable: 'Engine Number of Cylinders', Value: '4' },
          { Variable: 'Fuel Type - Primary', Value: 'Gasoline' },
          { Variable: 'Transmission Style', Value: 'Manual' },
          { Variable: 'Error Code', Value: '0' },
          { Variable: 'Error Text', Value: '' },
        ],
      }),
    })

    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/vin?vin=12345678901234567')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.make).toBe('Honda')
    expect(data.model).toBe('CBR600RR')
    expect(data.year).toBe(2020)
  })
})
```

**Step 3: Write API route**

```typescript
// src/app/api/vin/route.ts
import { NextResponse } from 'next/server'
import type { VinDecodedResult } from '@/types/database.types'

const NHTSA_API_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues'

function extractValue(results: Array<{ Variable: string; Value: string | null }>, variableName: string): string | null {
  const entry = results.find((r) => r.Variable === variableName)
  return entry?.Value || null
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const vin = searchParams.get('vin')

  if (!vin) {
    return NextResponse.json({ error: 'VIN parameter is required' }, { status: 400 })
  }

  if (vin.length !== 17) {
    return NextResponse.json({ error: 'VIN must be exactly 17 characters' }, { status: 400 })
  }

  try {
    const response = await fetch(`${NHTSA_API_URL}/${vin}?format=json`)

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to decode VIN' }, { status: 502 })
    }

    const data = await response.json()
    const results = data.Results as Array<{ Variable: string; Value: string | null }>

    const yearStr = extractValue(results, 'Model Year')

    const decoded: VinDecodedResult = {
      make: extractValue(results, 'Make'),
      model: extractValue(results, 'Model'),
      year: yearStr ? parseInt(yearStr, 10) : null,
      vehicleType: extractValue(results, 'Vehicle Type'),
      engineSize: extractValue(results, 'Displacement (L)'),
      fuelType: extractValue(results, 'Fuel Type - Primary'),
      displacement: extractValue(results, 'Displacement (L)'),
      cylinders: extractValue(results, 'Engine Number of Cylinders'),
      transmissionType: extractValue(results, 'Transmission Style'),
      errorCode: extractValue(results, 'Error Code'),
      errorText: extractValue(results, 'Error Text'),
    }

    return NextResponse.json(decoded)
  } catch {
    return NextResponse.json({ error: 'Failed to connect to NHTSA API' }, { status: 502 })
  }
}
```

**Step 4: Write VinDecoder component test**

```tsx
// src/components/VinDecoder.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VinDecoder } from './VinDecoder'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('VinDecoder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the VIN input field', () => {
    render(<VinDecoder />)
    expect(screen.getByPlaceholderText(/enter 17-character vin/i)).toBeInTheDocument()
  })

  it('renders the decode button', () => {
    render(<VinDecoder />)
    expect(screen.getByRole('button', { name: /decode/i })).toBeInTheDocument()
  })

  it('shows error when VIN is not 17 characters', async () => {
    const user = userEvent.setup()
    render(<VinDecoder />)

    await user.type(screen.getByPlaceholderText(/enter 17-character vin/i), 'SHORT')
    await user.click(screen.getByRole('button', { name: /decode/i }))

    expect(screen.getByText(/vin must be exactly 17 characters/i)).toBeInTheDocument()
  })

  it('displays decoded results on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        make: 'Honda',
        model: 'CBR600RR',
        year: 2020,
        vehicleType: 'MOTORCYCLE',
        cylinders: '4',
        fuelType: 'Gasoline',
      }),
    })

    const user = userEvent.setup()
    render(<VinDecoder />)

    await user.type(screen.getByPlaceholderText(/enter 17-character vin/i), '12345678901234567')
    await user.click(screen.getByRole('button', { name: /decode/i }))

    expect(await screen.findByText('Honda')).toBeInTheDocument()
    expect(screen.getByText('CBR600RR')).toBeInTheDocument()
    expect(screen.getByText('2020')).toBeInTheDocument()
  })

  it('shows error on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
    })

    const user = userEvent.setup()
    render(<VinDecoder />)

    await user.type(screen.getByPlaceholderText(/enter 17-character vin/i), '12345678901234567')
    await user.click(screen.getByRole('button', { name: /decode/i }))

    expect(await screen.findByText(/failed to decode vin/i)).toBeInTheDocument()
  })
})
```

**Step 5: Write VinDecoder component**

```tsx
// src/components/VinDecoder.tsx
'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { VinDecodedResult } from '@/types/database.types'
import { Scan, Loader2 } from 'lucide-react'

export function VinDecoder() {
  const [vin, setVin] = useState('')
  const [result, setResult] = useState<VinDecodedResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleDecode = async () => {
    setError(null)
    setResult(null)

    if (vin.length !== 17) {
      setError('VIN must be exactly 17 characters')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/vin?vin=${encodeURIComponent(vin)}`)
      if (!response.ok) {
        setError('Failed to decode VIN. Please try again.')
        return
      }
      const data: VinDecodedResult = await response.json()
      setResult(data)
    } catch {
      setError('Failed to decode VIN. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const displayFields = result
    ? [
        { label: 'Make', value: result.make },
        { label: 'Model', value: result.model },
        { label: 'Year', value: result.year?.toString() },
        { label: 'Vehicle Type', value: result.vehicleType },
        { label: 'Cylinders', value: result.cylinders },
        { label: 'Displacement', value: result.displacement ? `${result.displacement}L` : null },
        { label: 'Fuel Type', value: result.fuelType },
        { label: 'Transmission', value: result.transmissionType },
      ].filter((f) => f.value)
    : []

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Scan className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Enter 17-character VIN"
            value={vin}
            onChange={(e) => setVin(e.target.value.toUpperCase())}
            maxLength={17}
            className="pl-10 font-mono uppercase"
          />
        </div>
        <Button onClick={handleDecode} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Decode
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-4 text-center">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {result && displayFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Decoded VIN Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {displayFields.map(({ label, value }) => (
              <div key={label} className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

**Step 6: Replace the stub /vin page**

```tsx
// src/app/vin/page.tsx
import { VinDecoder } from '@/components/VinDecoder'

export default function VinPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold">VIN Decoder</h1>
        <p className="text-muted-foreground">
          Decode your motorcycle&apos;s Vehicle Identification Number using NHTSA data
        </p>
      </div>

      <VinDecoder />
    </div>
  )
}
```

Write VIN page test:

```tsx
// src/app/vin/page.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import VinPage from './page'

describe('VinPage', () => {
  it('renders the page title', () => {
    render(<VinPage />)
    expect(screen.getByRole('heading', { name: /vin decoder/i, level: 1 })).toBeInTheDocument()
  })

  it('renders the VIN input', () => {
    render(<VinPage />)
    expect(screen.getByPlaceholderText(/enter 17-character vin/i)).toBeInTheDocument()
  })

  it('renders the decode button', () => {
    render(<VinPage />)
    expect(screen.getByRole('button', { name: /decode/i })).toBeInTheDocument()
  })
})
```

**Step 7: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

**Step 8: Commit**
```bash
git add src/app/api/vin/ src/components/VinDecoder.tsx src/components/VinDecoder.test.tsx \
  src/app/vin/page.tsx src/app/vin/page.test.tsx src/types/database.types.ts
git commit -m "feat: build VIN decoder with NHTSA vPIC API integration"
```

---

## FINAL: Integration Test + Full Commit

### Task C1: Run full test suite and verify build

**Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass (original 83 + all new tests)

**Step 2: Run build to check for TypeScript errors**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 3: Verify test coverage**

Run: `npx vitest run --coverage`
Expected: Good coverage on all new components and pages

**Step 4: Final commit**
```bash
git add -A
git commit -m "feat: Phase 2 complete — diagnostic engine, DTC lookup, VIN decoder"
```

---

## Task Summary

| Task | Description | Workstream | Dependencies |
|------|------------|------------|--------------|
| A1 | shadcn/ui Input component | A | None |
| A2 | SafetyBadge component | A | None |
| A3 | TreeWalker component (core) | A | A2 |
| A4 | DiagnosticTreeCard component | A | None |
| A5 | /diagnose page (tree listing) | A | A4 |
| A6 | /diagnose/[treeId] page (tree walker) | A | A3 |
| A7 | Update bike detail page with trees | A | A4 |
| B1 | DTC components + /dtc page | B | A1 |
| B2 | VIN API route + decoder + /vin page | B | A1 |
| C1 | Full integration test + build | Both | All above |

**Parallelism:** Workstream A and Workstream B can be built simultaneously by separate agents. Within each workstream, tasks should be done in order. A1 (Input component) should be done first since both workstreams need it.
