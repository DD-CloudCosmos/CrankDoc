import record from '../../data/motorcycles/honda-cb650ra-2023.json'
import reference from '../../data/motorcycles/honda-cb650ra-2023-reference.json'
import schedule from '../../data/service-intervals/honda-cb650ra-2023.json'
import type { Motorcycle, ServiceInterval } from '@/types/database.types'

export const cb650r: Motorcycle = { created_at: '2026-10-05T00:00:00Z', ...record }
export const cb650rSpecSections = reference.sections
export const cb650rFluids = reference.fluids
export const cb650rManualUrl = 'https://www.hondamotopub.com/om/HMEE/CB650R/2023'
export const cb650rPressUrl = 'https://hondanews.eu/eu/en/motorcycles/media/pressreleases/418411/23ym-honda-cb650r-40'
export const cb650rScheduleNotes = 'Honda 2023 European owner’s manual, pages 69–70. The 1,000 km / 600 miles service is one-off; subsequent intervals repeat. Annual checks apply only where marked, and replacements have separate intervals. Inspect means clean, adjust, lubricate or replace if needed. Service the air cleaner more often in wet or dusty conditions. Honda recommends dealer service for intermediate work unless equipped and mechanically skilled. Wheels, tyres and steering bearings are technical work for a dealer. Coolant and brake-fluid replacement require mechanical skill. Perform pre-ride checks too.'
export const cb650rServiceIntervals: ServiceInterval[] = schedule.intervals.map((item, index) => ({
  ...item, id: `b4660699-fb60-4f70-b5c0-2023cb65${String(index + 1).padStart(4, '0')}`,
  motorcycle_id: cb650r.id, created_at: cb650r.created_at,
}))

export function supportsCB650RReference(bike: Pick<Motorcycle, 'make' | 'model' | 'year_start' | 'year_end'>) {
  return bike.make === 'Honda' && ['CB650R', 'CB650RA'].includes(bike.model) && bike.year_start === 2023 && bike.year_end === 2023
}
