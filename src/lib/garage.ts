/**
 * My Garage: the user's bikes and experience level, stored in the browser
 * (localStorage). No account, nothing is sent to the server.
 *
 * This module is pure (no React, no window access) so it is easy to test.
 * The React side lives in `src/hooks/useGarage.ts`.
 */

export const GARAGE_STORAGE_KEY = 'crankdoc:garage:v1'

export type SkillLevel = 'beginner' | 'home' | 'pro'
export type SafetyLevel = 'green' | 'yellow' | 'red'
export type TreeDifficulty = 'beginner' | 'intermediate' | 'advanced'

export interface Garage {
  /** Motorcycle ids (from the `motorcycles` table) the user works on */
  bikeIds: string[]
  /** Self-reported experience; null until onboarding sets it */
  skill: SkillLevel | null
  /** True once onboarding was completed or skipped */
  onboarded: boolean
}

export const EMPTY_GARAGE: Garage = { bikeIds: [], skill: null, onboarded: false }

export const SKILL_LEVELS: Array<{ id: SkillLevel; title: string; description: string; safety: SafetyLevel }> = [
  { id: 'beginner', title: 'Beginner', description: 'Checks and basic maintenance', safety: 'green' },
  { id: 'home', title: 'Home Mechanic', description: 'Multimeter, torque wrench, some electrics', safety: 'yellow' },
  { id: 'pro', title: 'Professional', description: 'Show everything, including advanced jobs', safety: 'red' },
]

const SKILL_IDS: SkillLevel[] = SKILL_LEVELS.map((s) => s.id)

/** Read a stored garage, falling back to EMPTY_GARAGE for anything malformed. */
export function parseGarage(raw: string | null): Garage {
  if (!raw) return EMPTY_GARAGE
  try {
    const value: unknown = JSON.parse(raw)
    if (typeof value !== 'object' || value === null) return EMPTY_GARAGE
    const record = value as Record<string, unknown>
    const bikeIds = Array.isArray(record.bikeIds)
      ? record.bikeIds.filter((id): id is string => typeof id === 'string')
      : []
    const skill = SKILL_IDS.includes(record.skill as SkillLevel) ? (record.skill as SkillLevel) : null
    const onboarded = record.onboarded === true
    return { bikeIds: Array.from(new Set(bikeIds)), skill, onboarded }
  } catch {
    return EMPTY_GARAGE
  }
}

export function serializeGarage(garage: Garage): string {
  return JSON.stringify(garage)
}

/** Add the bike if it is not in the garage, remove it if it is. */
export function toggleBike(garage: Garage, bikeId: string): Garage {
  const has = garage.bikeIds.includes(bikeId)
  return {
    ...garage,
    bikeIds: has ? garage.bikeIds.filter((id) => id !== bikeId) : [...garage.bikeIds, bikeId],
  }
}

const SAFETY_RANK: Record<SafetyLevel, number> = { green: 0, yellow: 1, red: 2 }
const SKILL_MAX_SAFETY: Record<SkillLevel, number> = { beginner: 0, home: 1, pro: 2 }
const DIFFICULTY_RANK: Record<TreeDifficulty, number> = { beginner: 0, intermediate: 1, advanced: 2 }

/**
 * True when a step's safety rating is beyond what the user said they are
 * comfortable with. With no skill set, nothing is flagged.
 */
export function isStepAboveSkill(safety: SafetyLevel, skill: SkillLevel | null): boolean {
  if (!skill) return false
  return SAFETY_RANK[safety] > SKILL_MAX_SAFETY[skill]
}

/** Same idea for a whole guide, using its difficulty. */
export function isTreeAboveSkill(difficulty: TreeDifficulty | null, skill: SkillLevel | null): boolean {
  if (!skill || !difficulty) return false
  return DIFFICULTY_RANK[difficulty] > SKILL_MAX_SAFETY[skill]
}

/** A bike as shown in the garage picker and on the home page. */
export interface GarageBikeOption {
  id: string
  make: string
  model: string
  imageUrl: string | null
  imageAlt: string | null
  /** Number of model-specific guides for this bike */
  treeCount: number
}
