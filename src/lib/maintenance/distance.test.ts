import { expect, it } from 'vitest'
import { toKilometres } from './distance'
it('converts miles once and rounds to three places', () => {
  expect(toKilometres(1000,'miles')).toBe(1609.344)
  expect(toKilometres(1,'miles')).toBe(1.609)
  expect(toKilometres(0,'km')).toBe(0)
  expect(toKilometres(12.3456,'km')).toBe(12.346)
})
it('rejects negative, nonfinite and out-of-range mileage', () => {
  for (const n of [-1,NaN,Infinity,1000000000]) expect(() => toKilometres(n,'km')).toThrow()
})
