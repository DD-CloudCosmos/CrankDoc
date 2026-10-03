import record from '../../data/motorcycles/honda-cb1000r-2008.json'
import reference from '../../data/motorcycles/honda-cb1000r-2008-reference.json'
import schedule from '../../data/service-intervals/honda-cb1000r-2008.json'
import type { Motorcycle, TechnicalDocument, MotorcycleImage, ServiceInterval } from '@/types/database.types'

export const cb1000r: Motorcycle = {
  created_at: '2026-10-03T00:00:00Z',
  ...record,
}

export function supportsBrakeLesson(bike: Pick<Motorcycle, 'make' | 'model' | 'year_start' | 'year_end'>) {
  return bike.make === 'Honda' && ['CB1000R', 'CB1000RA'].includes(bike.model) && bike.year_start === 2008 && bike.year_end === 2008
}

export const cb1000rSpecSections = reference.sections
export const cb1000rFluids = reference.fluids
export const cb1000rServiceIntervals: ServiceInterval[] = schedule.intervals.map((item, index) => ({
  ...item, id: `b4660699-fb60-4f70-b5c0-2008cb${String(index + 1).padStart(6, '0')}`,
  motorcycle_id: cb1000r.id, created_at: cb1000r.created_at,
}))
export const cb1000rImage: MotorcycleImage = {
  id: 'b4660699-fb60-4f70-b5c0-2008cb1000a3', motorcycle_id: cb1000r.id,
  image_url: record.image_url, alt_text: 'Early Honda CB1000R SC60 reference motorcycle in red, showing the original headlamp, inline-four engine and single-sided swingarm',
  is_primary: true, source_attribution: 'Photo: Addvisor / Wikimedia Commons, CC BY-SA 3.0. Unchanged photograph; reference bike, not the owner’s motorcycle.', created_at: cb1000r.created_at,
}

export const cb1000rDocuments: TechnicalDocument[] = [
  { id: 'b4660699-fb60-4f70-b5c0-2008cb1000a1', motorcycle_id: cb1000r.id, title: 'CB1000R - non-ABS (22-3)', doc_type: 'wiring_diagram', description: 'Factory wiring diagram. Use for the non-ABS model only.', file_url: '/diagrams/honda-cb1000r-2008.png', file_type: 'image/png', source_attribution: 'Honda CB1000R/RA service manual, Section 22, page 22-3', created_at: cb1000r.created_at },
  { id: 'b4660699-fb60-4f70-b5c0-2008cb1000a2', motorcycle_id: cb1000r.id, title: 'CB1000RA - ABS (22-4)', doc_type: 'wiring_diagram', description: 'Factory wiring diagram. Use for the ABS model only.', file_url: '/diagrams/honda-cb1000ra-2008.png', file_type: 'image/png', source_attribution: 'Honda CB1000R/RA service manual, Section 22, page 22-4', created_at: cb1000r.created_at },
  { id: 'b4660699-fb60-4f70-b5c0-2008cb1000a4', motorcycle_id: cb1000r.id, title: 'Honda CB1000R/RA 2008 factory service manual', doc_type: 'service_manual', description: 'The authoritative uploaded manual, preserved unchanged. Select the procedure matching your market and ABS equipment.', file_url: '/manuals/honda-cb1000r-2008.pdf', file_type: 'application/pdf', source_attribution: 'Honda Motor Co., Ltd., April 2008; uploaded factory service manual', created_at: cb1000r.created_at },
]
