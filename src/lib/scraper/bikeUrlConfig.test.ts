import { describe, it, expect } from 'vitest'
import { BIKE_CONFIGS, getBikeSlug, filterBikes } from './bikeUrlConfig'

describe('BIKE_CONFIGS', () => {
  it('contains all 12 target bikes', () => {
    expect(BIKE_CONFIGS).toHaveLength(12)
  })

  it('has no duplicate slugs', () => {
    const slugs = BIKE_CONFIGS.map(getBikeSlug)
    const uniqueSlugs = new Set(slugs)
    expect(uniqueSlugs.size).toBe(slugs.length)
  })

  it('every bike has at least one source', () => {
    for (const bike of BIKE_CONFIGS) {
      expect(bike.sources.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('every source has a well-formed URL', () => {
    for (const bike of BIKE_CONFIGS) {
      for (const source of bike.sources) {
        expect(() => new URL(source.url)).not.toThrow()
      }
    }
  })

  it('every wikipedia source has a wikiPageTitle', () => {
    for (const bike of BIKE_CONFIGS) {
      for (const source of bike.sources) {
        if (source.sourceType === 'wikipedia') {
          expect(source.wikiPageTitle).toBeDefined()
          expect(source.wikiPageTitle!.length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('includes all 5 core motorcycles', () => {
    const makes = BIKE_CONFIGS.map((b) => `${b.make} ${b.model}`)
    expect(makes).toContain('Honda CBR600RR')
    expect(makes).toContain('Yamaha MT-07')
    expect(makes).toContain('Harley-Davidson Sportster 883')
    expect(makes).toContain('Kawasaki Ninja 400')
    expect(makes).toContain('BMW R1250GS')
  })

  it('includes all 7 Kymco scooters', () => {
    const kymcoBikes = BIKE_CONFIGS.filter((b) => b.make === 'Kymco')
    expect(kymcoBikes).toHaveLength(7)
  })
})

describe('getBikeSlug', () => {
  it('converts make and model to lowercase hyphenated slug', () => {
    expect(getBikeSlug(BIKE_CONFIGS[0])).toBe('honda-cbr600rr')
  })

  it('handles multi-word models', () => {
    const harley = BIKE_CONFIGS.find((b) => b.model === 'Sportster 883')!
    expect(getBikeSlug(harley)).toBe('harley-davidson-sportster-883')
  })

  it('handles models with spaces', () => {
    const ak = BIKE_CONFIGS.find((b) => b.model === 'AK 550i')!
    expect(getBikeSlug(ak)).toBe('kymco-ak-550i')
  })
})

describe('filterBikes', () => {
  it('returns all bikes when passed ["all"]', () => {
    expect(filterBikes(['all'])).toHaveLength(12)
  })

  it('returns all bikes when passed empty array', () => {
    expect(filterBikes([])).toHaveLength(12)
  })

  it('filters by single slug', () => {
    const result = filterBikes(['honda-cbr600rr'])
    expect(result).toHaveLength(1)
    expect(result[0].make).toBe('Honda')
    expect(result[0].model).toBe('CBR600RR')
  })

  it('filters by multiple slugs', () => {
    const result = filterBikes(['honda-cbr600rr', 'yamaha-mt-07'])
    expect(result).toHaveLength(2)
  })

  it('is case-insensitive', () => {
    const result = filterBikes(['Honda-CBR600RR'])
    expect(result).toHaveLength(1)
  })

  it('returns empty array for unknown slugs', () => {
    const result = filterBikes(['nonexistent-bike'])
    expect(result).toHaveLength(0)
  })
})
