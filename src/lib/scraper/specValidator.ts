/**
 * Cross-Source Spec Validator
 *
 * Compares motorcycle specs from multiple data sources to detect
 * discrepancies. When sources disagree beyond configurable tolerance
 * thresholds, the validator flags the differences as warnings.
 */

import { normalizeSpec, specDifference, type NormalizedSpec } from './specNormalizer'

/** A spec entry from a single source. */
export interface SourceSpec {
  /** Source identifier (e.g., "wikipedia", "motorcyclespecs") */
  source: string
  /** Spec label (e.g., "Displacement", "Max Power") */
  label: string
  /** Raw value string */
  value: string
}

/** A discrepancy found between sources. */
export interface SpecDiscrepancy {
  /** The spec label where disagreement was found */
  label: string
  /** All source values for this spec */
  values: Array<{ source: string; raw: string; normalized: NormalizedSpec }>
  /** Percentage difference between highest and lowest numeric values */
  percentDiff: number | null
  /** Severity: "warning" if within tolerance, "error" if beyond */
  severity: 'warning' | 'error'
}

/** Tolerance thresholds for spec comparisons (percentage). */
export interface ValidationThresholds {
  /** Max allowed difference for displacement (cc) — default 1% */
  displacement: number
  /** Max allowed difference for power (hp/kW) — default 5% */
  power: number
  /** Max allowed difference for torque (Nm) — default 5% */
  torque: number
  /** Max allowed difference for weight (kg) — default 3% */
  weight: number
  /** Max allowed difference for dimensions (mm) — default 2% */
  dimensions: number
  /** Default tolerance for other numeric specs */
  default: number
}

const DEFAULT_THRESHOLDS: ValidationThresholds = {
  displacement: 1,
  power: 5,
  torque: 5,
  weight: 3,
  dimensions: 2,
  default: 5,
}

/**
 * Validates specs from multiple sources for a single motorcycle.
 * Groups specs by label, normalizes values, and flags discrepancies.
 *
 * @param specs - Array of specs from all sources
 * @param thresholds - Optional tolerance thresholds (percentage)
 * @returns Array of discrepancies found
 */
export function validateSpecs(
  specs: SourceSpec[],
  thresholds: Partial<ValidationThresholds> = {}
): SpecDiscrepancy[] {
  const mergedThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds }
  const discrepancies: SpecDiscrepancy[] = []

  // Group specs by normalized label
  const groups = groupByLabel(specs)

  for (const [label, entries] of groups) {
    // Need at least 2 sources to compare
    if (entries.length < 2) continue

    const normalized = entries.map((entry) => ({
      source: entry.source,
      raw: entry.value,
      normalized: normalizeSpec(entry.value),
    }))

    // Only compare entries that have numeric values
    const withValues = normalized.filter((n) => n.normalized.value !== null)
    if (withValues.length < 2) continue

    // Check if all numeric values are from the same unit
    const units = new Set(withValues.map((v) => v.normalized.unit))
    if (units.size > 1) continue

    // Find max difference
    const values = withValues.map((v) => v.normalized.value!)
    const min = Math.min(...values)
    const max = Math.max(...values)

    if (min === max) continue

    const diff = specDifference(withValues[0].normalized, withValues[1].normalized)
    if (diff === null) continue

    const threshold = getThreshold(label, mergedThresholds)
    const severity = diff > threshold ? 'error' : 'warning'

    discrepancies.push({
      label,
      values: normalized,
      percentDiff: Math.round(diff * 100) / 100,
      severity,
    })
  }

  return discrepancies
}

/**
 * Groups specs by a normalized label for comparison.
 * Normalizes labels: lowercase, trim, collapse whitespace.
 */
function groupByLabel(specs: SourceSpec[]): Map<string, SourceSpec[]> {
  const groups = new Map<string, SourceSpec[]>()

  for (const spec of specs) {
    const normalizedLabel = spec.label.toLowerCase().trim().replace(/\s+/g, ' ')
    const existing = groups.get(normalizedLabel) ?? []
    existing.push(spec)
    groups.set(normalizedLabel, existing)
  }

  return groups
}

/**
 * Returns the appropriate threshold for a spec label based on
 * what type of measurement it represents.
 */
function getThreshold(label: string, thresholds: ValidationThresholds): number {
  const lower = label.toLowerCase()

  if (/displacement|capacity|engine\s*size|cc/.test(lower)) {
    return thresholds.displacement
  }
  if (/power|hp|bhp|kw|output/.test(lower)) {
    return thresholds.power
  }
  if (/torque|nm/.test(lower)) {
    return thresholds.torque
  }
  if (/weight|mass/.test(lower)) {
    return thresholds.weight
  }
  if (/height|width|length|wheelbase|trail|travel|ground clearance/.test(lower)) {
    return thresholds.dimensions
  }

  return thresholds.default
}
