import record from '../../data/motorcycles/honda-cb1000r-2008.json'
import type { Motorcycle, TechnicalDocument } from '@/types/database.types'

export const cb1000r: Motorcycle = {
  image_url: null, dry_weight_kg: null, horsepower: null, torque_nm: null,
  fuel_capacity_liters: null, oil_capacity_liters: null, coolant_capacity_liters: null,
  valve_clearance_intake: null, valve_clearance_exhaust: null, spark_plug: null,
  created_at: '2026-10-03T00:00:00Z',
  ...record,
}

export function supportsBrakeLesson(bike: Pick<Motorcycle, 'make' | 'model' | 'year_start' | 'year_end'>) {
  return bike.make === 'Honda' && ['CB1000R', 'CB1000RA'].includes(bike.model) && bike.year_start === 2008 && bike.year_end === 2008
}

export const cb1000rDocuments: TechnicalDocument[] = [
  { id: 'b4660699-fb60-4f70-b5c0-2008cb1000a1', motorcycle_id: cb1000r.id, title: 'CB1000R - non-ABS (22-3)', doc_type: 'wiring_diagram', description: 'Factory wiring diagram. Use for the non-ABS model only.', file_url: '/diagrams/honda-cb1000r-2008.png', file_type: 'image/png', source_attribution: 'Honda CB1000R/RA service manual, Section 22, page 22-3', created_at: cb1000r.created_at },
  { id: 'b4660699-fb60-4f70-b5c0-2008cb1000a2', motorcycle_id: cb1000r.id, title: 'CB1000RA - ABS (22-4)', doc_type: 'wiring_diagram', description: 'Factory wiring diagram. Use for the ABS model only.', file_url: '/diagrams/honda-cb1000ra-2008.png', file_type: 'image/png', source_attribution: 'Honda CB1000R/RA service manual, Section 22, page 22-4', created_at: cb1000r.created_at },
]
