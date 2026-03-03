import { describe, it, expect } from 'vitest'
import { validateSpecs, type SourceSpec } from './specValidator'

describe('specValidator', () => {
  it('returns empty array when sources agree', () => {
    const specs: SourceSpec[] = [
      { source: 'wikipedia', label: 'Displacement', value: '599 cc' },
      { source: 'motorcyclespecs', label: 'Displacement', value: '599 cc' },
    ]

    const result = validateSpecs(specs)
    expect(result).toHaveLength(0)
  })

  it('flags discrepancy when values differ beyond threshold', () => {
    const specs: SourceSpec[] = [
      { source: 'wikipedia', label: 'Displacement', value: '599 cc' },
      { source: 'motorcyclespecs', label: 'Displacement', value: '650 cc' },
    ]

    const result = validateSpecs(specs)
    expect(result).toHaveLength(1)
    expect(result[0].label).toBe('displacement')
    expect(result[0].severity).toBe('error')
    expect(result[0].percentDiff).not.toBeNull()
    expect(result[0].percentDiff!).toBeGreaterThan(1)
  })

  it('uses warning severity for small differences', () => {
    const specs: SourceSpec[] = [
      { source: 'wikipedia', label: 'Max Power', value: '117 hp' },
      { source: 'motorcyclespecs', label: 'Max Power', value: '118 hp' },
    ]

    const result = validateSpecs(specs)
    expect(result).toHaveLength(1)
    expect(result[0].severity).toBe('warning')
  })

  it('skips non-numeric specs (e.g., "Liquid cooled")', () => {
    const specs: SourceSpec[] = [
      { source: 'wikipedia', label: 'Cooling', value: 'Liquid cooled' },
      { source: 'motorcyclespecs', label: 'Cooling', value: 'Liquid-cooled' },
    ]

    const result = validateSpecs(specs)
    expect(result).toHaveLength(0)
  })

  it('normalizes labels for comparison (case-insensitive)', () => {
    const specs: SourceSpec[] = [
      { source: 'wikipedia', label: 'Seat Height', value: '820 mm' },
      { source: 'motorcyclespecs', label: 'seat height', value: '850 mm' },
    ]

    const result = validateSpecs(specs)
    expect(result).toHaveLength(1)
    expect(result[0].label).toBe('seat height')
  })

  it('skips specs with only one source', () => {
    const specs: SourceSpec[] = [
      { source: 'wikipedia', label: 'Displacement', value: '599 cc' },
      { source: 'motorcyclespecs', label: 'Top Speed', value: '162.5 mph' },
    ]

    const result = validateSpecs(specs)
    expect(result).toHaveLength(0)
  })

  it('includes all source values in discrepancy report', () => {
    const specs: SourceSpec[] = [
      { source: 'wikipedia', label: 'Weight', value: '169 kg' },
      { source: 'motorcyclespecs', label: 'Weight', value: '175 kg' },
    ]

    const result = validateSpecs(specs)
    expect(result).toHaveLength(1)
    expect(result[0].values).toHaveLength(2)
    expect(result[0].values[0].source).toBe('wikipedia')
    expect(result[0].values[1].source).toBe('motorcyclespecs')
  })

  it('accepts custom thresholds', () => {
    const specs: SourceSpec[] = [
      { source: 'a', label: 'Displacement', value: '599 cc' },
      { source: 'b', label: 'Displacement', value: '600 cc' },
    ]

    // With default 1% threshold, this is a warning
    const withDefault = validateSpecs(specs)
    expect(withDefault).toHaveLength(1)

    // With 0% threshold, this should be an error
    const withStrict = validateSpecs(specs, { displacement: 0 })
    expect(withStrict).toHaveLength(1)
    expect(withStrict[0].severity).toBe('error')
  })

  it('uses correct threshold per spec category', () => {
    // Power has 5% threshold by default
    const specs: SourceSpec[] = [
      { source: 'a', label: 'Max Power', value: '117 hp' },
      { source: 'b', label: 'Max Power', value: '121 hp' },
    ]

    const result = validateSpecs(specs)
    expect(result).toHaveLength(1)
    // 4 hp difference on ~119 avg = ~3.3% — within 5% threshold
    expect(result[0].severity).toBe('warning')
  })
})
