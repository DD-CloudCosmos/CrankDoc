import { describe, expect, it } from 'vitest'
import { brakeState, brakeWires } from './cb1000rBrake'

describe('Honda brake-light circuit', () => {
  for (const ignition of [false, true]) {
    for (const front of [false, true]) {
      for (const rear of [false, true]) {
        it(`ignition=${ignition}, front=${front}, rear=${rear}`, () => {
          const state = brakeState({ ignition, front, rear })
          expect(state.lampOn).toBe(ignition && (front || rear))
          expect(state.closedBranches).toEqual([
            ...(ignition && front ? ['front'] : []),
            ...(ignition && rear ? ['rear'] : []),
          ])
        })
      }
    }
  }
  it('keeps the lamp connector colour change and tail circuit distinct', () => {
    expect(brakeWires.find(w => w.id === 'brake-feed')?.codes).toEqual(['G/Y', 'Bl/Y'])
    expect(brakeWires.find(w => w.id === 'return')?.codes).toEqual(['Bl', 'G'])
    expect(brakeWires.some(w => w.codes.includes('Bl/W'))).toBe(false)
  })
  it('does not energise an open parallel branch when the other brake is used', () => {
    expect(brakeState({ ignition: true, front: true, rear: false }).activeWires).not.toContain('rear-out')
  })
})
