'use client'

import { useCallback, useSyncExternalStore } from 'react'
import {
  EMPTY_GARAGE,
  GARAGE_STORAGE_KEY,
  parseGarage,
  serializeGarage,
  toggleBike as toggleBikeInGarage,
  type Garage,
  type SkillLevel,
} from '@/lib/garage'

// --- A tiny external store around localStorage ------------------------------
// useSyncExternalStore needs a stable snapshot, so we cache the parsed garage
// and only re-parse when the raw stored string changes.

const listeners = new Set<() => void>()
let cachedRaw: string | null | undefined
let cachedGarage: Garage = EMPTY_GARAGE
// Fallback when localStorage is blocked or full: the garage lives in memory
// for this page session instead of being lost on every update.
let memoryRaw: string | null = null

function readRaw(): string | null {
  if (memoryRaw !== null) return memoryRaw
  try {
    return window.localStorage.getItem(GARAGE_STORAGE_KEY)
  } catch {
    return null
  }
}

function getSnapshot(): Garage {
  const raw = readRaw()
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedGarage = parseGarage(raw)
  }
  return cachedGarage
}

/** On the server (and during hydration) there is no garage yet. */
function getServerSnapshot(): Garage | null {
  return null
}

function subscribe(callback: () => void) {
  listeners.add(callback)
  // Keep tabs in sync when the garage changes in another tab
  const onStorage = (event: StorageEvent) => {
    if (event.key === GARAGE_STORAGE_KEY) callback()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(callback)
    window.removeEventListener('storage', onStorage)
  }
}

function writeGarage(garage: Garage) {
  try {
    window.localStorage.setItem(GARAGE_STORAGE_KEY, serializeGarage(garage))
    memoryRaw = null
  } catch {
    // Storage full or blocked: keep the garage in memory so the UI still updates
    memoryRaw = serializeGarage(garage)
  }
  listeners.forEach((listener) => listener())
}

// --- The hook ---------------------------------------------------------------

export interface UseGarageResult {
  /** The stored garage, or null before the browser value is known (SSR/hydration) */
  garage: Garage | null
  toggleBike: (bikeId: string) => void
  setSkill: (skill: SkillLevel) => void
  completeOnboarding: () => void
  /** Show onboarding again, keeping the current bikes and skill (to edit them) */
  reopenOnboarding: () => void
  /** Clear the garage and show onboarding again */
  reset: () => void
}

export function useGarage(): UseGarageResult {
  const garage = useSyncExternalStore<Garage | null>(subscribe, getSnapshot, getServerSnapshot)

  const toggleBike = useCallback((bikeId: string) => {
    writeGarage(toggleBikeInGarage(getSnapshot(), bikeId))
  }, [])

  const setSkill = useCallback((skill: SkillLevel) => {
    writeGarage({ ...getSnapshot(), skill })
  }, [])

  const completeOnboarding = useCallback(() => {
    writeGarage({ ...getSnapshot(), onboarded: true })
  }, [])

  const reopenOnboarding = useCallback(() => {
    writeGarage({ ...getSnapshot(), onboarded: false })
  }, [])

  const reset = useCallback(() => {
    writeGarage(EMPTY_GARAGE)
  }, [])

  return { garage, toggleBike, setSkill, completeOnboarding, reopenOnboarding, reset }
}
