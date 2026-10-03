import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGarage } from './useGarage'
import { GARAGE_STORAGE_KEY } from '@/lib/garage'

describe('useGarage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('starts with an empty, not-onboarded garage', () => {
    const { result } = renderHook(() => useGarage())
    expect(result.current.garage).toEqual({ bikeIds: [], skill: null, onboarded: false })
  })

  it('reads an existing garage from localStorage', () => {
    window.localStorage.setItem(
      GARAGE_STORAGE_KEY,
      JSON.stringify({ bikeIds: ['bmw'], skill: 'pro', onboarded: true })
    )
    const { result } = renderHook(() => useGarage())
    expect(result.current.garage).toEqual({ bikeIds: ['bmw'], skill: 'pro', onboarded: true })
  })

  it('toggles bikes and persists them', () => {
    const { result } = renderHook(() => useGarage())
    act(() => result.current.toggleBike('mt07'))
    expect(result.current.garage?.bikeIds).toEqual(['mt07'])
    expect(JSON.parse(window.localStorage.getItem(GARAGE_STORAGE_KEY)!).bikeIds).toEqual(['mt07'])

    act(() => result.current.toggleBike('mt07'))
    expect(result.current.garage?.bikeIds).toEqual([])
  })

  it('sets skill and completes onboarding', () => {
    const { result } = renderHook(() => useGarage())
    act(() => result.current.setSkill('beginner'))
    act(() => result.current.completeOnboarding())
    expect(result.current.garage).toEqual({ bikeIds: [], skill: 'beginner', onboarded: true })
  })

  it('reopenOnboarding keeps bikes and skill', () => {
    const { result } = renderHook(() => useGarage())
    act(() => result.current.toggleBike('a'))
    act(() => result.current.setSkill('home'))
    act(() => result.current.completeOnboarding())
    act(() => result.current.reopenOnboarding())
    expect(result.current.garage).toEqual({ bikeIds: ['a'], skill: 'home', onboarded: false })
  })

  it('reset clears everything', () => {
    const { result } = renderHook(() => useGarage())
    act(() => result.current.toggleBike('a'))
    act(() => result.current.completeOnboarding())
    act(() => result.current.reset())
    expect(result.current.garage).toEqual({ bikeIds: [], skill: null, onboarded: false })
  })

  it('shares state between hook instances', () => {
    const first = renderHook(() => useGarage())
    const second = renderHook(() => useGarage())
    act(() => first.result.current.toggleBike('ninja'))
    expect(second.result.current.garage?.bikeIds).toEqual(['ninja'])
  })

  it('updates when another tab changes the garage', () => {
    const { result } = renderHook(() => useGarage())
    act(() => {
      window.localStorage.setItem(
        GARAGE_STORAGE_KEY,
        JSON.stringify({ bikeIds: ['x'], skill: null, onboarded: true })
      )
      window.dispatchEvent(new StorageEvent('storage', { key: GARAGE_STORAGE_KEY }))
    })
    expect(result.current.garage?.bikeIds).toEqual(['x'])
  })

  it('still updates in memory when localStorage throws', () => {
    const { result } = renderHook(() => useGarage())
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    act(() => result.current.completeOnboarding())
    expect(result.current.garage?.onboarded).toBe(true)
    setItem.mockRestore()
    getItem.mockRestore()
  })
})
