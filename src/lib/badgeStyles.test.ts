import { describe, it, expect } from 'vitest'
import { DIFFICULTY_STYLES, SEVERITY_STYLES } from './badgeStyles'

describe('DIFFICULTY_STYLES', () => {
  it('has entries for beginner, intermediate, and advanced', () => {
    expect(Object.keys(DIFFICULTY_STYLES)).toEqual(['beginner', 'intermediate', 'advanced'])
  })

  it('every entry has label and badgeClass', () => {
    for (const [key, value] of Object.entries(DIFFICULTY_STYLES)) {
      expect(value.label, `${key} missing label`).toBeDefined()
      expect(typeof value.label).toBe('string')
      expect(value.badgeClass, `${key} missing badgeClass`).toBeDefined()
      expect(typeof value.badgeClass).toBe('string')
    }
  })

  it('labels are capitalized versions of the keys', () => {
    for (const [key, value] of Object.entries(DIFFICULTY_STYLES)) {
      expect(value.label).toBe(key.charAt(0).toUpperCase() + key.slice(1))
    }
  })
})

describe('SEVERITY_STYLES', () => {
  it('has entries for low, medium, high, and critical', () => {
    expect(Object.keys(SEVERITY_STYLES)).toEqual(['low', 'medium', 'high', 'critical'])
  })

  it('every entry has label, dotClass, and badgeClass', () => {
    for (const [key, value] of Object.entries(SEVERITY_STYLES)) {
      expect(value.label, `${key} missing label`).toBeDefined()
      expect(typeof value.label).toBe('string')
      expect(value.dotClass, `${key} missing dotClass`).toBeDefined()
      expect(typeof value.dotClass).toBe('string')
      expect(value.badgeClass, `${key} missing badgeClass`).toBeDefined()
      expect(typeof value.badgeClass).toBe('string')
    }
  })

  it('labels are capitalized versions of the keys', () => {
    for (const [key, value] of Object.entries(SEVERITY_STYLES)) {
      expect(value.label).toBe(key.charAt(0).toUpperCase() + key.slice(1))
    }
  })

  it('dotClass values use Tailwind bg- classes', () => {
    for (const value of Object.values(SEVERITY_STYLES)) {
      expect(value.dotClass).toMatch(/^bg-/)
    }
  })
})
