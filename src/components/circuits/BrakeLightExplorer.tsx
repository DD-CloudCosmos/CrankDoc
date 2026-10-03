'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { brakeState, brakeWires, type BrakeControls } from '@/lib/circuits/cb1000rBrake'
import { BrakeCircuitDiagram } from './BrakeCircuitDiagram'

const LESSON = [
  { title: 'Meet the circuit', body: 'A brake light needs a complete path from the battery and back. Tap a wire to learn what it connects.', hint: 'The return wire is just as necessary as the supply wire. A ground symbol represents a connection to the common return wiring.' },
  { title: 'Complete the path', body: 'Turn the ignition on, then apply the front brake. Release it and watch the switch open again.', hint: 'A switch is a gap you can close. The drawing shows that gap; it is not a broken wire.' },
  { title: 'Two brakes, one light', body: 'With the ignition on, what must you apply to turn on the brake light? Make a prediction, then try the controls.', hint: 'Trace the two branches. Does one switch depend on the other being closed?' },
  { title: 'Read your Honda diagram', body: 'Select the brake feed to follow its colour changes. Open More to compare it with the factory diagram.', hint: 'G/Y means green with a yellow stripe. It is a wire identity, not a universal rule about what green wires do.' },
]

interface BrakeLightExplorerProps { initialMode?: 'learn' | 'explore' }

export function BrakeLightExplorer({ initialMode = 'learn' }: BrakeLightExplorerProps) {
  const [mode, setMode] = useState<'learn' | 'explore'>(initialMode)
  const [step, setStep] = useState(0)
  const [controls, setControls] = useState<BrakeControls>({ ignition: false, front: false, rear: false })
  const [selected, setSelected] = useState<string | null>(null)
  const [showColours, setShowColours] = useState(true)
  const [hint, setHint] = useState(false)
  const [answer, setAnswer] = useState<'either' | 'both' | null>(null)
  const [view, setView] = useState<'teaching' | 'factory'>('teaching')
  const [zoom, setZoom] = useState(1)
  const [more, setMore] = useState(false)
  const [connections, setConnections] = useState(false)
  const visibleControls: (keyof BrakeControls)[] = mode === 'explore' || step === 2 ? ['ignition', 'front', 'rear'] : step === 1 ? controls.rear ? ['ignition', 'front', 'rear'] : ['ignition', 'front'] : []
  const state = brakeState(controls)
  const wire = brakeWires.find(item => item.id === selected)

  function move(next: number) { setStep(next); setHint(false) }
  function restart() {
    setStep(0); setControls({ ignition: false, front: false, rear: false }); setSelected(null)
    setAnswer(null); setHint(false); setView('teaching'); setZoom(1); setMore(false); setConnections(false)
  }

  return (
    <section className="space-y-5" aria-label="Brake-light circuit explorer">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-[13px] text-muted-foreground">CIRCUIT EXPLORER</p><h2 className="text-[24px] font-semibold tracking-tight">Why does the brake light turn on?</h2></div>
        <SegmentedControl options={[{ value: 'learn', label: 'Teach me' }, { value: 'explore', label: 'Explore' }]} value={mode} onChange={setMode} className="shrink-0 whitespace-nowrap" aria-label="Learning mode" />
      </div>
      {mode === 'learn' && (
        <div className="rounded-[14px] bg-input p-4 space-y-3">
          <p className="text-[13px] text-muted-foreground">Step {step + 1} of {LESSON.length}</p>
          <h3 className="text-[19px] font-semibold">{LESSON[step].title}</h3>
          <p className="text-[15px] leading-relaxed">{LESSON[step].body}</p>
          {step === 2 && <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button className="max-w-full whitespace-normal h-auto min-h-12" variant="outline" onClick={() => setAnswer('either')}>Either brake is enough</Button>
              <Button className="max-w-full whitespace-normal h-auto min-h-12" variant="outline" onClick={() => setAnswer('both')}>Both brakes are required</Button>
            </div>
            {answer && <p role="status">{answer === 'either' ? 'Correct. The switches are in parallel: either branch can complete the path.' : 'Each switch can complete the circuit on its own. Try using only the rear brake.'}</p>}
          </div>}
        </div>
      )}
      {visibleControls.length > 0 && <div className="flex flex-wrap gap-3" aria-label="Circuit controls">
        {visibleControls.map(id => <Button className="max-w-full whitespace-normal h-auto min-h-12" key={id} variant={controls[id] ? 'default' : 'outline'} aria-label={id === 'ignition' ? 'Ignition' : id === 'front' ? 'Front brake' : 'Rear brake'} aria-pressed={controls[id]} onClick={() => setControls(previous => ({ ...previous, [id]: !previous[id] }))}>
          {id === 'ignition' ? 'Ignition' : id === 'front' ? 'Front brake' : 'Rear brake'}: {id === 'ignition' ? controls[id] ? 'on' : 'off' : controls[id] ? 'applied' : 'released'}
        </Button>)}
      </div>}
      <p role="status" aria-label="Lamp state" className="font-semibold">Brake light {state.lampOn ? 'on' : 'off'} <span className="font-normal text-muted-foreground">· {controls.front ? 'Front switch closed' : 'Front switch open'} · {controls.rear ? 'Rear switch closed' : 'Rear switch open'}</span></p>
      <div className="overflow-auto rounded-[14px] border border-separator bg-card" tabIndex={0} aria-label="Scrollable wiring diagram">
        <div className={zoom === 2 ? view === 'teaching' ? 'w-[200%] min-w-[1400px]' : 'w-[200%] min-w-[1800px]' : 'w-full'}>
          {view === 'teaching' ? <BrakeCircuitDiagram controls={controls} selected={selected} onSelect={setSelected} showColours={showColours} /> : <Image src="/diagrams/honda-cb1000r-2008.png" alt="Honda CB1000R factory wiring diagram, manual page 22-3" width={4813} height={3293} className="h-auto min-w-[900px] w-full" unoptimized />}
        </div>
      </div>
      <p className="text-[13px] text-muted-foreground">{view === 'teaching' ? 'Tap a wire to trace its connections. Blue dots show a completed path; an outline marks your selection.' : 'Honda factory reference · CB1000R (non-ABS) · page 22-3'}</p>
      {wire && <div className="rounded-[14px] bg-input p-4" role="region" aria-label="Selected connection" aria-live="polite">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">{wire.label}</h3>
          <Button className="max-w-full whitespace-normal h-auto min-h-12" variant="ghost" aria-label="Close wire details" onClick={() => setSelected(null)}>Close</Button>
        </div>
        <p className="mt-1 text-[15px]">{wire.codes.join(' → ')} · {wire.colours.join(' → ')}</p>
        <p className="mt-2 text-[15px] leading-relaxed">{wire.explanation}</p>
      </div>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {mode === 'learn' && <div className="flex gap-2">
          <Button className="max-w-full whitespace-normal h-auto min-h-12" variant="outline" disabled={step === 0} onClick={() => move(step - 1)}>Back</Button>
          <Button className="max-w-full whitespace-normal h-auto min-h-12" disabled={step === LESSON.length - 1} onClick={() => move(step + 1)}>Next</Button>
        </div>}
        <Button className="max-w-full whitespace-normal h-auto min-h-12" variant="ghost" onClick={() => setMore(!more)} aria-expanded={more} aria-controls="circuit-tools">More</Button>
      </div>
      {more && <div id="circuit-tools" className="space-y-4 rounded-[14px] bg-input p-4">
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl options={[{ value: 'teaching', label: 'Teaching view' }, { value: 'factory', label: 'Factory reference' }]} value={view} onChange={setView} className="w-full sm:w-auto" aria-label="Diagram view" />
        {view === 'teaching' && <Button className="max-w-full whitespace-normal h-auto min-h-12" variant="outline" onClick={() => setShowColours(!showColours)} aria-pressed={showColours}>Wire colours {showColours ? 'on' : 'off'}</Button>}
        <Button className="max-w-full whitespace-normal h-auto min-h-12" variant="ghost" onClick={() => setZoom(zoom === 1 ? 2 : 1)}>{zoom === 1 ? 'Zoom in' : 'Reset zoom'}</Button>
      </div>
        {mode === 'learn' && <>
          <div className="flex flex-wrap gap-2">
            <Button className="max-w-full whitespace-normal h-auto min-h-12" variant="ghost" onClick={() => setHint(!hint)} aria-expanded={hint}>{hint ? 'Hide hint' : 'Show hint'}</Button>
            <Button className="max-w-full whitespace-normal h-auto min-h-12" variant="ghost" onClick={restart}>Restart lesson</Button>
          </div>
          {hint && <p className="text-[15px] text-muted-foreground">{LESSON[step].hint}</p>}
        </>}
        <p className="text-[13px] text-muted-foreground">Honda CB1000R / CB1000RA · 2008 manual · Brake-light subset shared by both factory sheets. Your bike’s ABS equipment is unconfirmed.</p>
      <p className="text-[13px] text-muted-foreground">{view === 'teaching' ? 'Blue dotted lines show completed paths, not measured voltage. A blue outline selects connected wire segments and stops at components. Small outlined boxes mark connector colour changes; arrows list the codes before and after them. Fuses and ground connections are assumed intact.' : 'Unchanged scan from the Honda service manual, page 22-3 (CB1000R). This full-bike reference is not interactive. Enlarging it cannot recover unreadable labels.'}</p>
        <p className="text-[13px] text-muted-foreground">Learning model only: the tail-light input, other fuse-box loads and the rest of the motorcycle are omitted. No physical connector pin numbers or orientation are inferred.</p>
      </div>}
      {(mode === 'explore' || more) && <div>
        <Button className="max-w-full whitespace-normal h-auto min-h-12" variant="ghost" onClick={() => setConnections(!connections)} aria-expanded={connections} aria-controls="connection-list">Connections</Button>
        {connections && <div id="connection-list" className="mt-2 flex flex-wrap gap-2" aria-label="Select a connection">
          {brakeWires.map(item => <Button className="max-w-full whitespace-normal h-auto min-h-12" key={item.id} variant={item.net === wire?.net ? 'default' : 'outline'} aria-label={`Select ${item.label}`} aria-pressed={item.id === selected} onClick={() => setSelected(item.id)}>{item.label}</Button>)}
        </div>}
      </div>}
    </section>
  )
}
