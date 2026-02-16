/**
 * NHTSA Recall API Client
 *
 * Fetches vehicle recall data from the National Highway Traffic Safety
 * Administration (NHTSA) API and maps it to our database schema.
 *
 * @see https://api.nhtsa.gov/
 */

import type { Database } from '@/types/database.types'

/** Shape of a single recall result from the NHTSA API. */
export interface NhtsaRecallResult {
  NHTSACampaignNumber: string
  Manufacturer: string
  Component: string | null
  Summary: string | null
  Consequence: string | null
  Remedy: string | null
  Notes: string | null
  ReportReceivedDate: string | null
  ModelYear: number
  Make: string
  Model: string
  /** NHTSA returns "Y"/"N" strings or booleans for parkIt. */
  parkIt: string | boolean
  /** NHTSA uses "parkOutSide" (capital S) — returns "Y"/"N" strings or booleans. */
  parkOutSide: string | boolean
}

/** Envelope shape returned by the NHTSA recalls API. */
export interface NhtsaRecallResponse {
  Count: number
  results: NhtsaRecallResult[]
}

type RecallInsert = Database['public']['Tables']['recalls']['Insert']

const NHTSA_BASE_URL = 'https://api.nhtsa.gov/recalls/recallsByVehicle'
const MAX_RETRIES = 3
const BACKOFF_MS = [500, 1000, 2000]

/**
 * Converts a parkIt / parkOutSide value from the NHTSA API to a boolean.
 * NHTSA may return "Y", "N", true, false, or other string values.
 */
function toBooleanFlag(value: string | boolean | null | undefined): boolean {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'string') {
    return value.toUpperCase() === 'Y'
  }
  return false
}

/**
 * Maps a raw NHTSA recall result (PascalCase fields) to our database Insert shape
 * (snake_case fields). Sets `data_source` to `'nhtsa'`.
 */
export function mapNhtsaToRecall(raw: NhtsaRecallResult): RecallInsert {
  return {
    nhtsa_campaign_number: raw.NHTSACampaignNumber,
    data_source: 'nhtsa',
    manufacturer: raw.Manufacturer,
    make: raw.Make,
    model: raw.Model,
    model_year: raw.ModelYear,
    component: raw.Component ?? null,
    summary: raw.Summary ?? null,
    consequence: raw.Consequence ?? null,
    remedy: raw.Remedy ?? null,
    notes: raw.Notes ?? null,
    report_received_date: raw.ReportReceivedDate ?? null,
    park_it: toBooleanFlag(raw.parkIt),
    park_outside: toBooleanFlag(raw.parkOutSide),
  }
}

/**
 * Pauses execution for the given number of milliseconds.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Fetches recall data from the NHTSA API for a specific vehicle.
 *
 * Includes retry logic: up to 3 attempts with exponential backoff
 * (500ms, 1000ms, 2000ms). Returns an empty array on final failure
 * rather than throwing.
 */
export async function fetchNhtsaRecalls(
  make: string,
  model: string,
  modelYear: number
): Promise<NhtsaRecallResult[]> {
  const url = `${NHTSA_BASE_URL}?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${encodeURIComponent(String(modelYear))}`

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`NHTSA API returned status ${response.status}`)
      }

      const data = (await response.json()) as NhtsaRecallResponse

      if (data.Count === 0 || !data.results) {
        return []
      }

      return data.results
    } catch {
      // If we have retries left, wait with exponential backoff
      if (attempt < MAX_RETRIES - 1) {
        await delay(BACKOFF_MS[attempt])
      }
    }
  }

  // All retries exhausted — return empty array instead of throwing
  return []
}
