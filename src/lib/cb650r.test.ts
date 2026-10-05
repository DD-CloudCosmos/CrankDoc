import { describe, expect, it } from 'vitest'
import { cb650r, cb650rFluids, cb650rSpecSections, cb650rServiceIntervals, supportsCB650RReference } from './cb650r'

describe('2023 CB650RA reference', () => {
  it('selects only the correct model year and distinguishes curb weight from dry weight', () => {
    expect(supportsCB650RReference(cb650r)).toBe(true)
    expect(supportsCB650RReference({ ...cb650r, model: 'CB650R' })).toBe(true)
    expect(supportsCB650RReference({ ...cb650r, year_start: 2024, year_end: 2024 })).toBe(false)
    expect(supportsCB650RReference({ ...cb650r, model: 'CBR650R' })).toBe(false)
    expect(supportsCB650RReference({ ...cb650r, make: 'Yamaha' })).toBe(false)
    expect(cb650r.dry_weight_kg).toBeNull()
    const rows = cb650rSpecSections.flatMap(section => section.rows)
    expect(rows.find(row => row.label === 'Curb weight')?.value).toContain('203 kg')
    expect(rows.find(row => row.label === 'Length × width × height')?.value).toContain('2,120')
  })
  it('keeps distinct replacement and inspection schedules and manual mile figures', () => {
    const item = (name: string) => cb650rServiceIntervals.find(item => item.service_name === name)!
    expect(item('First service (one-off)').interval_km).toBe(1000)
    expect(item('Engine oil replacement')).toMatchObject({ interval_km: 12000, interval_miles: 8000, interval_months: 12 })
    expect(item('Engine oil filter replacement')).toMatchObject({ interval_km: 24000, interval_months: null })
    expect(item('Valve clearance inspection').interval_km).toBe(36000)
    expect(item('Spark plug replacement').interval_km).toBe(48000)
    expect(item('Coolant replacement')).toMatchObject({ interval_km: null, interval_months: 36 })
    expect(item('Brake fluid replacement')).toMatchObject({ interval_km: null, interval_months: 24 })
    expect(item('Drive chain slider inspection').interval_months).toBeNull()
    expect(item('Pre-ride checks')).toMatchObject({ interval_km: null, interval_miles: null, interval_months: null })
    expect(new Set(cb650rServiceIntervals.map(item => item.id)).size).toBe(30)
    expect(cb650rServiceIntervals.every(item => item.motorcycle_id === cb650r.id)).toBe(true)
  })
  it('preserves exact fluid quantities and leaves unsupported workshop settings empty', () => {
    expect(cb650rFluids.find(item => item.label === 'Engine Oil')?.capacity).toBe('2.3 L after draining; 2.6 L with filter; 3.0 L after disassembly')
    expect(cb650rFluids.find(item => item.label === 'Coolant')?.capacity).toBe('2.50 L cooling system')
    expect(cb650rFluids.some(item => item.label === 'Clutch Fluid')).toBe(false)
    expect(cb650r.valve_clearance_intake).toBeNull()
    expect(cb650r.valve_clearance_exhaust).toBeNull()
    expect(cb650rServiceIntervals.every(item => item.torque_spec === null)).toBe(true)
  })
})
