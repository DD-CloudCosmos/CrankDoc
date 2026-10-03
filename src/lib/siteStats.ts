/**
 * Catalogue numbers shown on the landing page.
 *
 * Kept as constants (not live queries) so the home page renders instantly and
 * still works if the database is down. `siteStats.test.ts` recounts them from
 * the seed data in `data/` and fails if they drift — update them there.
 */
export const SITE_STATS = {
  /** Diagnostic guides (data/trees) */
  treeCount: 119,
  /** Decision steps across all guides */
  stepCount: 2977,
  /** Fault codes (data/dtc) */
  dtcCount: 664,
  /** Manufacturers with fault codes */
  dtcManufacturerCount: 11,
  /** Service jobs with torque/fluid specs (data/service-intervals) */
  serviceIntervalCount: 234,
  /** Motorcycle and scooter models with guides */
  modelCount: 18,
} as const
