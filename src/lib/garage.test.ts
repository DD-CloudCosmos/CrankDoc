import { describe, it, expect } from 'vitest'
import {
  EMPTY_GARAGE,
  parseGarage,
  serializeGarage,
  toggleBike,
  isStepAboveSkill,
  isTreeAboveSkill,
} from './garage'

describe('parseGarage', () => {
  it('returns the empty garage for null or empty input', () => {
    expect(parseGarage(null)).toEqual(EMPTY_GARAGE)
    expect(parseGarage('')).toEqual(EMPTY_GARAGE)
  })

  it('returns the empty garage for invalid JSON or non-objects', () => {
    expect(parseGarage('{not json')).toEqual(EMPTY_GARAGE)
    expect(parseGarage('42')).toEqual(EMPTY_GARAGE)
    expect(parseGarage('null')).toEqual(EMPTY_GARAGE)
  })

  it('round-trips a valid garage', () => {
    const garage = { bikeIds: ['a', 'b'], skill: 'home' as const, onboarded: true }
    expect(parseGarage(serializeGarage(garage))).toEqual(garage)
  })

  it('drops non-string ids, duplicates and unknown skills', () => {
    const raw = JSON.stringify({ bikeIds: ['a', 1, 'a', null, 'b'], skill: 'wizard', onboarded: 'yes' })
    expect(parseGarage(raw)).toEqual({ bikeIds: ['a', 'b'], skill: null, onboarded: false })
  })

  it('handles a missing bikeIds field', () => {
    expect(parseGarage(JSON.stringify({ skill: 'pro', onboarded: true }))).toEqual({
      bikeIds: [],
      skill: 'pro',
      onboarded: true,
    })
  })
})

describe('toggleBike', () => {
  it('adds a bike that is not in the garage', () => {
    expect(toggleBike(EMPTY_GARAGE, 'x').bikeIds).toEqual(['x'])
  })

  it('removes a bike that is already in the garage', () => {
    const garage = { ...EMPTY_GARAGE, bikeIds: ['x', 'y'] }
    expect(toggleBike(garage, 'x').bikeIds).toEqual(['y'])
  })

  it('does not mutate the original garage', () => {
    const garage = { ...EMPTY_GARAGE, bikeIds: ['x'] }
    toggleBike(garage, 'y')
    expect(garage.bikeIds).toEqual(['x'])
  })
})

describe('isStepAboveSkill', () => {
  it('never flags when no skill is set', () => {
    expect(isStepAboveSkill('red', null)).toBe(false)
  })

  it('flags yellow and red steps for beginners', () => {
    expect(isStepAboveSkill('green', 'beginner')).toBe(false)
    expect(isStepAboveSkill('yellow', 'beginner')).toBe(true)
    expect(isStepAboveSkill('red', 'beginner')).toBe(true)
  })

  it('flags only red steps for home mechanics', () => {
    expect(isStepAboveSkill('yellow', 'home')).toBe(false)
    expect(isStepAboveSkill('red', 'home')).toBe(true)
  })

  it('never flags for professionals', () => {
    expect(isStepAboveSkill('red', 'pro')).toBe(false)
  })
})

describe('isTreeAboveSkill', () => {
  it('never flags without skill or difficulty', () => {
    expect(isTreeAboveSkill('advanced', null)).toBe(false)
    expect(isTreeAboveSkill(null, 'beginner')).toBe(false)
  })

  it('maps difficulty onto skill levels', () => {
    expect(isTreeAboveSkill('intermediate', 'beginner')).toBe(true)
    expect(isTreeAboveSkill('intermediate', 'home')).toBe(false)
    expect(isTreeAboveSkill('advanced', 'home')).toBe(true)
    expect(isTreeAboveSkill('advanced', 'pro')).toBe(false)
  })
})
