import { describe, expect, it } from 'vitest'
import { parseBikeInput, validateCatalogueScope } from './garageBikes'
const input = { motorcycleId: null, nickname: '', make: 'Honda', model: 'Custom', year: null, variant: '', market: '', registration: '', mileageKm: null }
describe('parseBikeInput', () => {
  it('accepts a custom bike with unknown year and mileage', () => expect(parseBikeInput(input)).toEqual(input))
  it('accepts zero mileage', () => expect(parseBikeInput({ ...input, mileageKm: 0 }).mileageKm).toBe(0))
  it.each([-1, NaN, Infinity])('rejects invalid mileage %s', mileageKm => expect(() => parseBikeInput({ ...input, mileageKm })).toThrow())
  it.each(['make', 'model'])('rejects blank %s', field => expect(() => parseBikeInput({ ...input, [field]: '  ' })).toThrow())
  it.each([['nickname', 80], ['make', 120], ['model', 120], ['variant', 120], ['market', 120], ['registration', 40]])('enforces %s limit', (field, limit) => {
    expect(() => parseBikeInput({ ...input, [field]: 'a'.repeat(Number(limit)) })).not.toThrow()
    expect(() => parseBikeInput({ ...input, [field]: 'a'.repeat(Number(limit) + 1) })).toThrow()
  })
  it.each([1884, 2101, 2023.5, NaN])('rejects invalid year %s', year => expect(() => parseBikeInput({ ...input, year })).toThrow())
  it('rejects malformed catalogue IDs', () => expect(() => parseBikeInput({ ...input, motorcycleId: 'invalid' })).toThrow())
  it.each([null, [], 'bike', { ...input, year: '2023' }, { ...input, mileageKm: '0' }])('rejects malformed input', value => expect(() => parseBikeInput(value)).toThrow())
})

describe('catalogue scope', () => {
  const model = { make: 'Honda', model: 'Custom', year_start: 2020, year_end: 2023 }
  it('accepts unknown year and the range boundaries', () => {
    for (const year of [null, 2020, 2023]) expect(() => validateCatalogueScope({ ...input, year }, model)).not.toThrow()
  })
  it('accepts a newer year when the catalogue range is open', () => expect(() => validateCatalogueScope({ ...input, year: 2026 }, { ...model, year_end: null })).not.toThrow())
  it.each([2019, 2024])('rejects year %s outside the catalogue range', year => expect(() => validateCatalogueScope({ ...input, year }, model)).toThrow())
  it('rejects mismatched make or model', () => {
    expect(() => validateCatalogueScope({ ...input, make: 'Yamaha' }, model)).toThrow()
    expect(() => validateCatalogueScope({ ...input, model: 'Different' }, model)).toThrow()
  })
})

describe('bike mileage display', () => {
  it('keeps unknown and zero distinct, and offers miles without altering stored kilometres', async () => {
    const { formatBikeMileage } = await import('./garageBikes')
    expect(formatBikeMileage(null, 'mi')).toBe('Mileage not recorded')
    expect(formatBikeMileage(0)).toBe('0 km')
    expect(formatBikeMileage(1.609344, 'mi')).toBe('1 mi')
  })
})
