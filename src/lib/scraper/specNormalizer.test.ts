import { describe, it, expect } from 'vitest'
import { normalizeSpec, specDifference } from './specNormalizer'

describe('normalizeSpec', () => {
  it('parses displacement: "599 cc / 36.5 cu-in"', () => {
    const result = normalizeSpec('599 cc / 36.5 cu-in')
    expect(result.value).toBe(599)
    expect(result.unit).toBe('cc')
    expect(result.secondaryValue).toBe(36.5)
    expect(result.secondaryUnit).toBe('cu-in')
  })

  it('parses power: "117 hp / 87.2 kW @ 13000 rpm"', () => {
    const result = normalizeSpec('117 hp / 87.2 kW @ 13000 rpm')
    expect(result.value).toBe(117)
    expect(result.unit).toBe('hp')
    expect(result.secondaryValue).toBe(87.2)
    expect(result.secondaryUnit).toBe('kW')
  })

  it('parses kW-first power: "100 kW (136 hp) at 7,750 rpm"', () => {
    const result = normalizeSpec('100 kW (136 hp) at 7,750 rpm')
    expect(result.value).toBe(136)
    expect(result.unit).toBe('hp')
    expect(result.secondaryValue).toBe(100)
    expect(result.secondaryUnit).toBe('kW')
  })

  it('parses torque: "64 Nm / 6.53 kgf-m @ 11000 rpm"', () => {
    const result = normalizeSpec('64 Nm / 6.53 kgf-m @ 11000 rpm')
    expect(result.value).toBe(64)
    expect(result.unit).toBe('Nm')
    expect(result.secondaryValue).toBe(6.53)
  })

  it('parses compression ratio: "12.0:1"', () => {
    const result = normalizeSpec('12.0:1')
    expect(result.value).toBe(12.0)
    expect(result.unit).toBe('ratio')
  })

  it('parses transmission: "6-speed"', () => {
    const result = normalizeSpec('6-speed')
    expect(result.value).toBe(6)
    expect(result.unit).toBe('speed')
  })

  it('parses weight: "169 kg / 372.5 lbs"', () => {
    const result = normalizeSpec('169 kg / 372.5 lbs')
    expect(result.value).toBe(169)
    expect(result.unit).toBe('kg')
    expect(result.secondaryValue).toBe(372.5)
    expect(result.secondaryUnit).toBe('lbs')
  })

  it('parses dimension: "820 mm / 32.3 in"', () => {
    const result = normalizeSpec('820 mm / 32.3 in')
    expect(result.value).toBe(820)
    expect(result.unit).toBe('mm')
    expect(result.secondaryValue).toBe(32.3)
    expect(result.secondaryUnit).toBe('in')
  })

  it('parses single value: "599 cc"', () => {
    const result = normalizeSpec('599 cc')
    expect(result.value).toBe(599)
    expect(result.unit).toBe('cc')
  })

  it('parses comma-separated numbers: "1,254 cc"', () => {
    const result = normalizeSpec('1,254 cc')
    expect(result.value).toBe(1254)
    expect(result.unit).toBe('cc')
  })

  it('returns raw string for unparseable values', () => {
    const result = normalizeSpec('Liquid cooled')
    expect(result.value).toBeNull()
    expect(result.unit).toBeNull()
    expect(result.raw).toBe('Liquid cooled')
  })

  it('handles empty string', () => {
    const result = normalizeSpec('')
    expect(result.value).toBeNull()
  })

  it('parses fuel capacity: "18 liters / 4.7 US gal"', () => {
    const result = normalizeSpec('18 liters / 4.7 US gal')
    expect(result.value).toBe(18)
    expect(result.unit).toBe('L')
  })
})

describe('specDifference', () => {
  it('returns 0 for identical values', () => {
    const a = normalizeSpec('599 cc')
    const b = normalizeSpec('599 cc')
    expect(specDifference(a, b)).toBe(0)
  })

  it('returns percentage difference', () => {
    const a = normalizeSpec('600 cc')
    const b = normalizeSpec('599 cc')
    const diff = specDifference(a, b)
    expect(diff).not.toBeNull()
    expect(diff!).toBeLessThan(1)
  })

  it('returns null for different units', () => {
    const a = normalizeSpec('600 cc')
    const b = normalizeSpec('600 mm')
    expect(specDifference(a, b)).toBeNull()
  })

  it('returns null when values cannot be compared', () => {
    const a = normalizeSpec('Liquid cooled')
    const b = normalizeSpec('Air cooled')
    expect(specDifference(a, b)).toBeNull()
  })
})
