import { describe, expect, it } from 'vitest'
import { cb1000r, cb1000rDocuments, cb1000rImage, cb1000rServiceIntervals, cb1000rSpecSections, cb1000rFluids, supportsBrakeLesson } from './cb1000r'

describe('CB1000R catalogue reference', () => {
  it('keeps supported specifications and variant-labelled factory diagrams', () => {
    expect(cb1000r).toMatchObject({ make: 'Honda', model: 'CB1000R', displacement_cc: 998, year_start: 2008, year_end: 2008, horsepower: 123.4, torque_nm: 99, fuel_capacity_liters: 17, oil_capacity_liters: 3, coolant_capacity_liters: 3 })
    expect(cb1000r.dry_weight_kg).toBeNull()
    expect(cb1000rDocuments.slice(0, 2).map(doc => doc.title)).toEqual(['CB1000R - non-ABS (22-3)', 'CB1000RA - ABS (22-4)'])
    expect(cb1000rDocuments.some(doc => doc.doc_type === 'service_manual')).toBe(true)
  })
  it('never attaches this reference to a different bike or unsupported generation', () => {
    expect(supportsBrakeLesson(cb1000r)).toBe(true)
    expect(supportsBrakeLesson({ ...cb1000r, model: 'CBR600RR' })).toBe(false)
    expect(supportsBrakeLesson({ ...cb1000r, year_start: 2018 })).toBe(false)
  })
  it('preserves oil operations, coolant reserve and fork variants', () => {
    expect(cb1000rFluids.find(item => item.label === 'Engine Oil')?.capacity).toMatch(/2.7.*drain.*3.0.*filter.*3.6.*disassembly/)
    expect(cb1000rFluids.find(item => item.label === 'Coolant')?.capacity).toMatch(/3.0.*0.35/)
    expect(cb1000rFluids.find(item => item.label === 'Fork Oil')?.capacity).toMatch(/CB1000R.*511.*CB1000RA.*542/)
    const rows = cb1000rSpecSections.flatMap(section => section.rows)
    expect(rows.find(row => row.label === 'Curb weight')?.value).toContain('217 kg')
    expect(rows.find(row => row.label === 'Curb weight')?.value).toContain('222 kg')
  })
  it('separates first service, recurring work, inspection and replacement', () => {
    const find = (name: string) => cb1000rServiceIntervals.find(item => item.service_name === name)
    expect(find('First service (one-off)')).toMatchObject({ interval_km: 1000, interval_miles: 600 })
    expect(find('Engine oil and filter replacement')).toMatchObject({ interval_km: 12000, interval_miles: 8000, interval_months: 12 })
    expect(find('Spark plug inspection')?.interval_km).toBe(24000)
    expect(find('Spark plug replacement')?.interval_km).toBe(48000)
    expect(find('Brake fluid replacement')).toMatchObject({ interval_km: 18000, interval_months: 24 })
    expect(find('Coolant replacement')).toMatchObject({ interval_km: 36000, interval_months: 24 })
    expect(find('Drive chain inspection and lubrication')?.interval_km).toBe(1000)
    expect(cb1000rServiceIntervals.every(item => item.motorcycle_id === cb1000r.id)).toBe(true)
    expect(new Set(cb1000rServiceIntervals.map(item => item.id)).size).toBe(cb1000rServiceIntervals.length)
  })
  it('uses a real licensed SC60 photo with an honest caption', () => {
    expect(cb1000rImage.image_url).toBe(cb1000r.image_url)
    expect(cb1000rImage.alt_text).toContain('reference motorcycle')
    expect(cb1000rImage.source_attribution).toContain('Addvisor')
    expect(cb1000rImage.source_attribution).toContain('CC BY-SA 3.0')
  })
})
