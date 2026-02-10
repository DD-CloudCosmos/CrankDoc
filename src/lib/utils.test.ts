import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn utility function', () => {
  it('merges single class name', () => {
    expect(cn('text-red-500')).toBe('text-red-500')
  })

  it('merges multiple class names', () => {
    expect(cn('text-red-500', 'bg-blue-500', 'p-4')).toBe('text-red-500 bg-blue-500 p-4')
  })

  it('handles conditional classes with undefined and false', () => {
    expect(cn('text-red-500', undefined, false && 'hidden', 'p-4')).toBe('text-red-500 p-4')
  })

  it('handles conditional classes with truthy values', () => {
    expect(cn('text-red-500', true && 'font-bold', 'p-4')).toBe('text-red-500 font-bold p-4')
  })

  it('resolves conflicting Tailwind classes by keeping the last one', () => {
    // tailwind-merge should keep the last conflicting class
    expect(cn('p-4', 'p-8')).toBe('p-8')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('handles arrays of class names', () => {
    expect(cn(['text-red-500', 'bg-blue-500'], 'p-4')).toBe('text-red-500 bg-blue-500 p-4')
  })

  it('handles empty input', () => {
    expect(cn()).toBe('')
  })

  it('handles complex conditional and conflicting classes', () => {
    const isActive = true
    const size = 'large'

    expect(
      cn(
        'base-class',
        isActive && 'active-class',
        !isActive && 'inactive-class',
        'text-sm', // This should be overridden by text-lg
        size === 'large' && 'text-lg'
      )
    ).toBe('base-class active-class text-lg')
  })
})
