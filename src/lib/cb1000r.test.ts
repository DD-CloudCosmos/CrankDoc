import { describe, expect, it } from 'vitest'
import { cb1000r, cb1000rDocuments, supportsBrakeLesson } from './cb1000r'

describe('CB1000R catalogue reference', () => {
  it('includes only supported bike specifications and both labelled source diagrams', () => {
    expect(cb1000r).toMatchObject({ make: 'Honda', model: 'CB1000R', displacement_cc: 998, year_start: 2008, year_end: 2008 })
    expect(cb1000r.horsepower).toBeNull()
    expect(cb1000rDocuments.map(doc => doc.title)).toEqual(['CB1000R - non-ABS (22-3)', 'CB1000RA - ABS (22-4)'])
  })
  it('never attaches this lesson to a different bike or unsupported generation', () => {
    expect(supportsBrakeLesson(cb1000r)).toBe(true)
    expect(supportsBrakeLesson({ ...cb1000r, model: 'CBR600RR' })).toBe(false)
    expect(supportsBrakeLesson({ ...cb1000r, year_start: 2018 })).toBe(false)
  })
})
