import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Safety rule from CLAUDE.md: never instruct users to defeat safety systems.
 * A guide once told beginners that a kickstand switch "can be bypassed
 * temporarily". This test reads every guide in data/trees and fails if a
 * step about a rider-protection interlock tells the user to bypass or
 * bridge something.
 */
type TreeNode = { id: string; text?: string; instructions?: string; action?: string; details?: string; warning?: string }

const treesDir = path.join(process.cwd(), 'data/trees')

/** True when the step is about an interlock that protects the rider (not, say, a fan switch). */
function isAboutInterlock(stepText: string): boolean {
  return /\b(clutch|side ?stand|kick ?stand|kill|neutral)\b[^.]{0,40}\bswitch|interlock|tip-over sensor|bank angle sensor/i.test(stepText)
}

/** Sentences in an interlock step that mention bypassing or bridging without forbidding it. */
function findBypassInstructions(stepText: string): string[] {
  if (!isAboutInterlock(stepText)) return []
  return stepText.split(/(?<=[.!?])\s+/).filter((sentence) => {
    const mentionsBypass = /\b(bypass\w*|jump(?:ing|ed|er)?|bridg\w+)\b/i.test(sentence)
    const forbidsIt = /\b(never|do not|don't)\b/i.test(sentence)
    return mentionsBypass && !forbidsIt
  })
}

describe('diagnostic guides: safety systems', () => {
  it('recognises a bypass instruction in a step about an interlock', () => {
    expect(findBypassInstructions('The kickstand safety switch stops the starter. The switch can be bypassed temporarily.')).toHaveLength(1)
    expect(findBypassInstructions('The clutch switch is on the perch. Test by jumping the wires.')).toHaveLength(1)
  })

  it('ignores prohibitions and steps that are not about an interlock', () => {
    expect(findBypassInstructions('Check the clutch switch with a multimeter. Never bridge the wires.')).toHaveLength(0)
    expect(findBypassInstructions('Apply 12V to the fan motor, bypassing the thermo switch.')).toHaveLength(0)
    expect(findBypassInstructions('Clean the idle air bypass port.')).toHaveLength(0)
  })

  it('never tells the user to bypass or bridge a safety interlock', () => {
    const offenders: string[] = []
    const files = fs.readdirSync(treesDir).filter((file) => file.endsWith('.json'))
    expect(files.length).toBeGreaterThan(100)

    for (const file of files) {
      const tree = JSON.parse(fs.readFileSync(path.join(treesDir, file), 'utf8')) as { tree_data: { nodes: TreeNode[] } }
      for (const node of tree.tree_data.nodes) {
        const stepText = [node.text, node.instructions, node.action, node.details, node.warning].filter(Boolean).join(' ')
        for (const sentence of findBypassInstructions(stepText)) {
          offenders.push(`${file} › ${node.id}: ${sentence}`)
        }
      }
    }

    expect(offenders).toEqual([])
  })
})
