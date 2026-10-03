import { SafetyBadge } from '@/components/SafetyBadge'
import type { DecisionTreeData, DecisionTreeNode } from '@/types/database.types'
import showcaseTree from '../../../data/trees/bmw-r1250gs-wont-start.json'

/**
 * The landing-page "product shot": a desktop app window showing a real step
 * from the BMW R 1250 GS no-start guide, read straight from the seed data.
 */

// The path through the tree that leads to the showcased step
const PATH = [
  { nodeId: 'start', optionIndex: 0 },
  { nodeId: 'battery_check_result', optionIndex: 1 },
] as const
const CURRENT_NODE_ID = 'check_battery_voltage'
const ANSWER_NODE_ID = 'battery_voltage_result'

// Reference readings from the step's instructions, shown as tiles
const READINGS = [
  { value: '12.6 V', label: 'Ideal' },
  { value: '12.0 V', label: 'CAN bus minimum' },
  { value: '10.0 V', label: 'While cranking' },
]

const nodes = (showcaseTree.tree_data as DecisionTreeData).nodes
function getNode(id: string): DecisionTreeNode {
  const node = nodes.find((n) => n.id === id)
  if (!node) throw new Error(`Showcase tree is missing node "${id}"`)
  return node
}

/** First sentence of a longer instruction text. */
function firstSentence(text: string): string {
  const match = text.match(/^.+?[.!?](\s|$)/)
  return (match ? match[0] : text).trim()
}

export function ProductWindow() {
  const current = getNode(CURRENT_NODE_ID)
  const answers = getNode(ANSWER_NODE_ID).options ?? []
  const pathAnswers = PATH.map(({ nodeId, optionIndex }) => getNode(nodeId).options?.[optionIndex]?.text ?? '')

  return (
    <figure aria-labelledby="product-window-caption" className="mx-auto max-w-[1040px] overflow-hidden rounded-[24px] border border-border bg-card text-left shadow-float">
      <figcaption id="product-window-caption" className="sr-only">
        Example: step 3 of the {showcaseTree.motorcycle_make} {showcaseTree.motorcycle_model} &ldquo;{showcaseTree.title}&rdquo; guide
      </figcaption>

      {/* Window chrome */}
      <div aria-hidden="true" className="flex h-10 items-center gap-2 border-b border-separator bg-background px-4">
        <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
        <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
        <span className="h-3 w-3 rounded-full bg-[#28C840]" />
        <span className="ml-4 text-[13px] text-muted-foreground">crankdoc.app/diagnose</span>
      </div>

      <div className="flex flex-wrap">
        {/* Sidebar: bike + answers so far */}
        <aside className="hidden max-w-[320px] flex-[1_1_260px] border-r border-separator bg-background px-3.5 py-5 sm:block">
          <div className="px-2">
            <div className="text-[15px] font-semibold">{showcaseTree.motorcycle_model}</div>
            <div className="text-[13px] text-muted-foreground">
              {showcaseTree.motorcycle_make} · {showcaseTree.title}
            </div>
          </div>
          <div className="mt-5 px-2 text-[12px] font-semibold uppercase text-muted-foreground">Your answers</div>
          <ol className="mt-2 space-y-0.5 text-[14px]">
            {pathAnswers.map((answer) => (
              <li key={answer} className="flex gap-2.5 rounded-[10px] px-2 py-2.5">
                <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-safe" />
                <span>{answer}</span>
              </li>
            ))}
            <li className="flex gap-2.5 rounded-[10px] bg-card px-2 py-2.5 font-semibold shadow-card">
              <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <span>{current.text}</span>
            </li>
          </ol>
        </aside>

        {/* Current step */}
        <div className="min-w-0 flex-[3_1_420px] px-6 py-7 sm:px-10 sm:py-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13px] text-muted-foreground">Step 3</span>
            <SafetyBadge level={current.safety} />
          </div>
          <h3 className="mt-2.5 text-[28px] font-semibold leading-tight tracking-[-0.025em] sm:text-[34px]">{current.text}</h3>
          {current.instructions && (
            <p className="mt-3 text-[17px] leading-relaxed text-muted-foreground">{firstSentence(current.instructions)}</p>
          )}

          <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
            {READINGS.map((reading) => (
              <div key={reading.label} className="rounded-[16px] bg-background p-4">
                <div className="text-[26px] font-semibold tracking-[-0.02em]">{reading.value}</div>
                <div className="mt-0.5 text-[13px] text-muted-foreground">{reading.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-[13px] font-semibold uppercase text-muted-foreground">
            {getNode(ANSWER_NODE_ID).text}
          </div>
          <ul className="mt-2 overflow-hidden rounded-[14px] bg-background text-[17px]">
            {answers.map((answer) => (
              <li key={answer.text} className="flex justify-between border-b border-separator px-4 py-3.5 last:border-b-0">
                <span>{answer.text}</span>
                <span aria-hidden="true" className="text-chevron">›</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </figure>
  )
}
