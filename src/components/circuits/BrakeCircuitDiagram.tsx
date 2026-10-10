'use client'

import { brakeState, brakeWires, type BrakeControls } from '@/lib/circuits/cb1000rBrake'


// Split insulation colours at connector boundaries; no physical pin orientation is implied.
const COLOURED_PARTS: Record<string, { path: string; base: string; stripe?: string }[]> = {
  battery: [{ path: 'M155 220 L180 220', base: 'wire-red' }],
  'ignition-feed': [{ path: 'M260 220 L300 220 L300 90 L350 90', base: 'wire-red', stripe: 'wire-black' }],
  'front-in': [{ path: 'M420 90 L450 90 L450 150 L485 150', base: 'wire-white', stripe: 'wire-green' }, { path: 'M485 150 L510 150', base: 'wire-black', stripe: 'wire-green' }],
  'rear-in': [{ path: 'M450 90 L450 330 L485 330', base: 'wire-white', stripe: 'wire-green' }, { path: 'M485 330 L510 330', base: 'wire-black' }],
  'front-out': [{ path: 'M590 150 L615 150', base: 'wire-black', stripe: 'wire-green' }, { path: 'M615 150 L640 150 L640 240', base: 'wire-green', stripe: 'wire-yellow' }],
  'rear-out': [{ path: 'M590 330 L615 330', base: 'wire-black' }, { path: 'M615 330 L640 330 L640 240', base: 'wire-green', stripe: 'wire-yellow' }],
  'brake-feed': [{ path: 'M640 240 L715 240', base: 'wire-green', stripe: 'wire-yellow' }, { path: 'M715 240 L735 240', base: 'wire-black', stripe: 'wire-yellow' }],
  return: [{ path: 'M795 270 L795 305', base: 'wire-black' }, { path: 'M795 305 L795 430 L110 430 L110 270', base: 'wire-green' }],
}

interface BrakeCircuitDiagramProps {
  controls: BrakeControls
  selected: string | null
  onSelect: (id: string) => void
  showColours: boolean
}

export function BrakeCircuitDiagram({ controls, selected, onSelect, showColours }: BrakeCircuitDiagramProps) {
  const state = brakeState(controls)
  const selectedNet = brakeWires.find(wire => wire.id === selected)?.net
  return (
    <svg viewBox="0 0 900 490" className="min-w-[700px] w-full text-foreground" role="img" aria-label="Honda brake-light circuit: two parallel brake switches">
      <title>Brake-light teaching diagram, rearranged from Honda Section 22</title>
      <desc>Battery, main fuse, ignition switch, fuse C, two parallel brake switches, brake-light input and ground return. Connector code changes are labelled on each wire.</desc>
      {brakeWires.map(wire => {
        const isSelected = wire.net === selectedNet
        const active = state.activeWires.includes(wire.id)
        return (
          <g key={wire.id} onClick={() => onSelect(wire.id)} className="cursor-pointer" data-wire={wire.id} data-selected={isSelected} data-complete-path={active}>
            {isSelected && <path d={wire.path} fill="none" strokeWidth="16" className="stroke-primary/30" />}
            <path d={wire.path} fill="none" strokeWidth="7" className="stroke-foreground/30" />
            {showColours ? COLOURED_PARTS[wire.id].map((part, index) => <g key={index}>
              <path d={part.path} fill="none" strokeWidth="4" className={part.base} />
              {part.stripe && <path d={part.path} fill="none" strokeWidth="2" strokeDasharray="6 5" className={part.stripe} />}
            </g>) : <path d={wire.path} fill="none" strokeWidth="4" className="stroke-foreground" />}
            {active && <path d={wire.path} fill="none" strokeWidth="2" strokeDasharray="2 7" className="stroke-primary" />}
            <path d={wire.path} fill="none" stroke="transparent" strokeWidth="30" />
            <text x={wire.labelX} y={wire.labelY} textAnchor="middle" fontSize="13" className="fill-foreground">{wire.codes.join(' → ')}</text>
          </g>
        )
      })}
      <g className="fill-card stroke-foreground" strokeWidth="1">
        {[[485, 150], [615, 150], [485, 330], [615, 330], [715, 240], [795, 305]].map(([x, y]) => <rect key={`${x}-${y}`} x={x - 4} y={y - 7} width="8" height="14" />)}
      </g>
      <g className="fill-card stroke-foreground" strokeWidth="2">
        <rect x="35" y="200" width="75" height="70" rx="10" />
        <rect x="125" y="208" width="30" height="24" rx="3" />
        <rect x="350" y="65" width="70" height="50" rx="8" />
        <rect x="735" y="210" width="120" height="60" rx="10" className={state.lampOn ? 'fill-primary/15 stroke-primary' : ''} />
      </g>
      <g className="fill-foreground" textAnchor="middle" fontSize="14">
        <text x="72" y="226">Battery</text><text x="72" y="246">12 V</text>
        <text x="105" y="175">Main fuse 30 A</text>
        <text x="385" y="85">Fuse C</text><text x="385" y="104">10 A</text>
        <text x="795" y="235">Brake light</text><text x="795" y="255">{state.lampOn ? 'ON' : 'OFF'}</text>
        <text x="220" y="270">Ignition</text>
        <text x="550" y="190">Front switch</text><text x="550" y="370">Rear switch</text>
        <text x="795" y="463">Ground return</text>
      </g>
      <g className="stroke-foreground" strokeWidth="3" fill="none">
        <path d="M110 220 H125 M130 220 H150" />
        <circle cx="180" cy="220" r="4" /><circle cx="260" cy="220" r="4" />
        <path d={controls.ignition ? 'M184 220 L256 220' : 'M184 220 L250 190'} />
        <circle cx="510" cy="150" r="4" /><circle cx="590" cy="150" r="4" />
        <path d={controls.front ? 'M514 150 L586 150' : 'M514 150 L580 120'} />
        <circle cx="510" cy="330" r="4" /><circle cx="590" cy="330" r="4" />
        <path d={controls.rear ? 'M514 330 L586 330' : 'M514 330 L580 300'} />
        <path d="M780 430 H810 M785 438 H805 M790 446 H800" />
      </g>
      <g className="fill-foreground"><circle cx="450" cy="90" r="5" /><circle cx="640" cy="240" r="5" /></g>
    </svg>
  )
}
