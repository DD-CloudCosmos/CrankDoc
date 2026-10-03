export type BrakeControls = { ignition: boolean; front: boolean; rear: boolean }
export type BrakeWire = {
  id: string
  label: string
  net: string
  codes: string[]
  colours: string[]
  explanation: string
  path: string
  labelX: number
  labelY: number
}

// Section 22, pages 22-3 and 22-4. Code changes belong to connector boundaries.
export const brakeWires: BrakeWire[] = [
  { id: 'battery', label: 'Battery supply', net: 'battery', codes: ['R'], colours: ['Red'], explanation: 'Main 30 A fuse to the ignition switch. The main fuse is assumed intact in this lesson.', path: 'M 155 220 L 180 220', labelX: 140, labelY: 205 },
  { id: 'ignition-feed', label: 'Ignition output', net: 'ignition', codes: ['R/Bl'], colours: ['Red / black'], explanation: 'The ignition switch supplies the branch fuse box when on.', path: 'M 260 220 L 300 220 L 300 90 L 350 90', labelX: 300, labelY: 65 },
  { id: 'front-in', label: 'Front switch supply', net: 'supply', codes: ['W/G', 'Bl/G'], colours: ['White / green', 'Black / green'], explanation: 'Fuse C (10 A) supplies the front switch. W/G changes to Bl/G at the 6P waterproof connector.', path: 'M 420 90 L 450 90 L 450 150 L 510 150', labelX: 475, labelY: 125 },
  { id: 'rear-in', label: 'Rear switch supply', net: 'supply', codes: ['W/G', 'Bl'], colours: ['White / green', 'Black'], explanation: 'The same fused supply feeds the rear switch. W/G changes to Bl at its waterproof connector.', path: 'M 450 90 L 450 330 L 510 330', labelX: 475, labelY: 305 },
  { id: 'front-out', label: 'Front switch output', net: 'brake', codes: ['Bl/G', 'G/Y'], colours: ['Black / green', 'Green / yellow'], explanation: 'After the front switch, Bl/G changes to G/Y at the 6P connector and joins the rear brake output.', path: 'M 590 150 L 640 150 L 640 240', labelX: 625, labelY: 125 },
  { id: 'rear-out', label: 'Rear switch output', net: 'brake', codes: ['Bl', 'G/Y'], colours: ['Black', 'Green / yellow'], explanation: 'After the rear switch, Bl changes to G/Y at its connector. Either switch can supply the joined brake feed.', path: 'M 590 330 L 640 330 L 640 240', labelX: 625, labelY: 305 },
  { id: 'brake-feed', label: 'Brake feed', net: 'brake', codes: ['G/Y', 'Bl/Y'], colours: ['Green / yellow', 'Black / yellow'], explanation: 'G/Y enters the rear lamp’s 3P connector and becomes Bl/Y on the lamp side. The separate tail-light input is not simulated.', path: 'M 640 240 L 735 240', labelX: 690, labelY: 215 },
  { id: 'return', label: 'Lamp return', net: 'return', codes: ['Bl', 'G'], colours: ['Black', 'Green'], explanation: 'The lamp-side black return becomes green at the 3P connector and joins the ground wiring.', path: 'M 795 270 L 795 430 L 110 430 L 110 270', labelX: 430, labelY: 415 },
]

export function brakeState({ ignition, front, rear }: BrakeControls) {
  const lampOn = ignition && (front || rear)
  return {
    lampOn,
    closedBranches: [...(ignition && front ? ['front'] : []), ...(ignition && rear ? ['rear'] : [])],
    // This is a completed-path highlight, not a voltage map or current measurement.
    activeWires: lampOn ? [
      'battery', 'ignition-feed', 'brake-feed', 'return',
      ...(front ? ['front-in', 'front-out'] : []),
      ...(rear ? ['rear-in', 'rear-out'] : []),
    ] : [],
  }
}
