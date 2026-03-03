/**
 * Spec Normalizer
 *
 * Normalizes raw motorcycle spec strings into structured values
 * for cross-source comparison. Handles common formats from
 * Wikipedia, motorcyclespecs.co.za, and manufacturer sites.
 */

/** A normalized spec value with numeric data and original text. */
export interface NormalizedSpec {
  /** The raw string value as extracted from the source */
  raw: string
  /** Primary numeric value (e.g., 599 for "599 cc") */
  value: number | null
  /** Unit of the primary value (e.g., "cc", "hp", "mm") */
  unit: string | null
  /** Secondary value if present (e.g., kW from "117 hp (87.2 kW)") */
  secondaryValue: number | null
  /** Secondary unit */
  secondaryUnit: string | null
}

/**
 * Normalizes a raw spec string into structured numeric data.
 *
 * Examples:
 * - "599 cc / 36.5 cu-in" → { value: 599, unit: "cc" }
 * - "117 hp / 87.2 kW @ 13000 rpm" → { value: 117, unit: "hp", secondaryValue: 87.2, secondaryUnit: "kW" }
 * - "67 x 42.5 mm" → { value: 67, unit: "mm" }
 * - "12.0:1" → { value: 12.0, unit: "ratio" }
 * - "6-speed" → { value: 6, unit: "speed" }
 */
export function normalizeSpec(raw: string): NormalizedSpec {
  const result: NormalizedSpec = {
    raw,
    value: null,
    unit: null,
    secondaryValue: null,
    secondaryUnit: null,
  }

  if (!raw || typeof raw !== 'string') return result

  const cleaned = raw.trim()

  // Compression ratio: "12.0:1"
  const ratioMatch = cleaned.match(/^([\d.]+)\s*:\s*1$/)
  if (ratioMatch) {
    result.value = parseFloat(ratioMatch[1])
    result.unit = 'ratio'
    return result
  }

  // Speed count: "6-speed", "6 Speed"
  const speedMatch = cleaned.match(/^(\d+)\s*[-\s]?speed/i)
  if (speedMatch) {
    result.value = parseInt(speedMatch[1], 10)
    result.unit = 'speed'
    return result
  }

  // Power with dual units: "117 hp / 87.2 kW" or "117 hp (87.2 kW)"
  const powerMatch = cleaned.match(
    /([\d.]+)\s*(hp|bhp|ps)\s*(?:\/|\()\s*([\d.]+)\s*(kW|kw)/i
  )
  if (powerMatch) {
    result.value = parseFloat(powerMatch[1])
    result.unit = powerMatch[2].toLowerCase()
    result.secondaryValue = parseFloat(powerMatch[3])
    result.secondaryUnit = 'kW'
    return result
  }

  // kW first: "100 kW (136 hp)"
  const kwFirstMatch = cleaned.match(
    /([\d.]+)\s*(kW|kw)\s*(?:\/|\()\s*([\d.]+)\s*(hp|bhp|ps)/i
  )
  if (kwFirstMatch) {
    result.value = parseFloat(kwFirstMatch[3])
    result.unit = kwFirstMatch[4].toLowerCase()
    result.secondaryValue = parseFloat(kwFirstMatch[1])
    result.secondaryUnit = 'kW'
    return result
  }

  // Torque with dual units: "64 Nm / 6.53 kgf-m" or "143 Nm (105 lb-ft)"
  const torqueMatch = cleaned.match(
    /([\d.]+)\s*(Nm|N·m|N\.m)\s*(?:\/|\()\s*([\d.]+)\s*(kgf[·\-]?m|lb[·\-\s]?ft|ft[·\-\s]?lb)/i
  )
  if (torqueMatch) {
    result.value = parseFloat(torqueMatch[1])
    result.unit = 'Nm'
    result.secondaryValue = parseFloat(torqueMatch[3])
    result.secondaryUnit = torqueMatch[4].toLowerCase().replace(/[·\-\s]/g, '')
    return result
  }

  // Displacement with dual units: "599 cc / 36.5 cu-in"
  const dispMatch = cleaned.match(
    /([\d,.]+)\s*(cc)\s*\/\s*([\d.]+)\s*(cu[\s-]?in)/i
  )
  if (dispMatch) {
    result.value = parseFloat(dispMatch[1].replace(/,/g, ''))
    result.unit = 'cc'
    result.secondaryValue = parseFloat(dispMatch[3])
    result.secondaryUnit = 'cu-in'
    return result
  }

  // Dimension with dual units: "820 mm / 32.3 in" or "169 kg / 372.5 lbs"
  const dualMatch = cleaned.match(
    /([\d,.]+)\s*(mm|cm|kg|liters?|litres?|L)\s*\/\s*([\d.]+)\s*(in|lbs?|US\s*gal(?:lons?)?|ft)/i
  )
  if (dualMatch) {
    result.value = parseFloat(dualMatch[1].replace(/,/g, ''))
    result.unit = normalizeUnit(dualMatch[2])
    result.secondaryValue = parseFloat(dualMatch[3])
    result.secondaryUnit = normalizeUnit(dualMatch[4])
    return result
  }

  // Single value with unit: "599 cc", "169 kg", "820 mm"
  const singleMatch = cleaned.match(
    /([\d,.]+)\s*(cc|mm|cm|kg|lbs?|hp|bhp|ps|kW|Nm|N·m|liters?|litres?|L|mph|km\/h|rpm|°|degrees?)/i
  )
  if (singleMatch) {
    result.value = parseFloat(singleMatch[1].replace(/,/g, ''))
    result.unit = normalizeUnit(singleMatch[2])
    return result
  }

  return result
}

/**
 * Compares two normalized spec values and returns the percentage
 * difference. Returns null if comparison isn't possible.
 */
export function specDifference(a: NormalizedSpec, b: NormalizedSpec): number | null {
  if (a.value === null || b.value === null) return null
  if (a.unit !== b.unit) return null
  if (a.value === 0 && b.value === 0) return 0

  const avg = (Math.abs(a.value) + Math.abs(b.value)) / 2
  if (avg === 0) return null

  return Math.abs(a.value - b.value) / avg * 100
}

/** Normalizes common unit variations to a canonical form. */
function normalizeUnit(unit: string): string {
  const lower = unit.toLowerCase().trim()
  const unitMap: Record<string, string> = {
    'liter': 'L',
    'liters': 'L',
    'litre': 'L',
    'litres': 'L',
    'l': 'L',
    'lb': 'lbs',
    'in': 'in',
    'bhp': 'hp',
    'ps': 'hp',
    'kw': 'kW',
    'nm': 'Nm',
    'n·m': 'Nm',
    'n.m': 'Nm',
    'degree': '°',
    'degrees': '°',
  }
  return unitMap[lower] ?? unit
}
