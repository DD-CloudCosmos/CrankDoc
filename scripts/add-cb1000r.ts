/** Onboard the supported SC60 reference without running the destructive reseed. */
import { config } from 'dotenv'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { cb1000r, cb1000rDocuments, cb1000rImage, cb1000rServiceIntervals } from '../src/lib/cb1000r'
import type { Database, Motorcycle, MotorcycleImage, ServiceInterval } from '../src/types/database.types'

type ExistingBike = Pick<Motorcycle, 'id' | 'make' | 'model' | 'year_start' | 'year_end'> & Partial<Motorcycle>
type ExistingDocument = { motorcycle_id: string; file_url: string }
type ExistingImage = Pick<MotorcycleImage, 'motorcycle_id' | 'image_url' | 'is_primary'>
type ExistingInterval = Pick<ServiceInterval, 'motorcycle_id' | 'service_name'>

export function planCB1000RImport(bikes: ExistingBike[], docs: ExistingDocument[], images: ExistingImage[] = [], intervals: ExistingInterval[] = []) {
  const existing = bikes.find(bike => bike.make === cb1000r.make && bike.model === cb1000r.model && bike.year_start === 2008 && bike.year_end === 2008)
  const bikeId = existing?.id ?? cb1000r.id
  const { created_at: _createdAt, ...record } = cb1000r
  const { id: _id, make: _make, model: _model, year_start: _start, year_end: _end, ...specs } = record
  const differentPower = existing?.horsepower != null && existing.horsepower !== cb1000r.horsepower
  const missingSpecs = existing ? Object.fromEntries(Object.entries(specs).filter(([key, value]) => value !== null && existing[key as keyof Motorcycle] == null && !(differentPower && key === 'torque_nm'))) : {}
  return {
    motorcycles: existing ? [] : [record],
    updates: Object.keys(missingSpecs).length ? [{ id: bikeId, values: missingSpecs as Database['public']['Tables']['motorcycles']['Update'] }] : [],
    documents: cb1000rDocuments.filter(doc => !docs.some(item => item.motorcycle_id === bikeId && item.file_url === doc.file_url)).map(doc => {
      const { created_at: _createdAt, ...document } = doc
      return { ...document, motorcycle_id: bikeId }
    }),
    images: images.some(item => item.motorcycle_id === bikeId && item.image_url === cb1000rImage.image_url) ? [] : [{
      id: cb1000rImage.id, motorcycle_id: bikeId, image_url: cb1000rImage.image_url,
      alt_text: cb1000rImage.alt_text, source_attribution: cb1000rImage.source_attribution,
      is_primary: !images.some(item => item.motorcycle_id === bikeId && item.is_primary),
    }],
    intervals: cb1000rServiceIntervals.filter(interval => !intervals.some(item => item.motorcycle_id === bikeId && item.service_name === interval.service_name)).map(interval => {
      const { created_at: _createdAt, ...record } = interval
      return { ...record, motorcycle_id: bikeId }
    }),
  }
}

export async function runCB1000RImport(apply = false) {
  config({ path: resolve(process.cwd(), '.env.local'), quiet: true })
  if (!apply) {
    console.log('Preview only; no database writes. For an empty catalogue:')
    console.log(JSON.stringify(planCB1000RImport([], []), null, 2))
    console.log('Apply with: npx tsx scripts/add-cb1000r.ts --apply')
    return
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing database credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.')
  const client = createClient<Database>(url, key)
  const bikes = await client.from('motorcycles').select('*').eq('make', 'Honda').eq('model', 'CB1000R')
  if (bikes.error) throw new Error(bikes.error.message)
  const existing = bikes.data?.find(bike => bike.year_start === 2008 && bike.year_end === 2008)
  const bikeId = existing?.id ?? cb1000r.id
  const [docs, images, intervals] = await Promise.all([
    client.from('technical_documents').select('motorcycle_id,file_url').eq('motorcycle_id', bikeId),
    client.from('motorcycle_images').select('motorcycle_id,image_url,is_primary').eq('motorcycle_id', bikeId),
    client.from('service_intervals').select('motorcycle_id,service_name').eq('motorcycle_id', bikeId),
  ])
  for (const result of [docs, images, intervals]) if (result.error) throw new Error(result.error.message)
  const plan = planCB1000RImport(bikes.data ?? [], docs.data ?? [], images.data ?? [], intervals.data ?? [])
  if (plan.motorcycles.length) {
    const result = await client.from('motorcycles').insert(plan.motorcycles)
    if (result.error) throw new Error(result.error.message)
  }
  for (const update of plan.updates) {
    const result = await client.from('motorcycles').update(update.values).eq('id', update.id)
    if (result.error) throw new Error(result.error.message)
  }
  if (plan.documents.length) {
    const result = await client.from('technical_documents').insert(plan.documents)
    if (result.error) throw new Error(result.error.message)
  }
  if (plan.images.length) {
    const result = await client.from('motorcycle_images').insert(plan.images)
    if (result.error) throw new Error(result.error.message)
  }
  if (plan.intervals.length) {
    const result = await client.from('service_intervals').insert(plan.intervals)
    if (result.error) throw new Error(result.error.message)
  }
  console.log(`Added ${plan.motorcycles.length} bike, ${plan.documents.length} documents, ${plan.images.length} photo and ${plan.intervals.length} service rows; filled missing specifications on ${plan.updates.length} bike. Existing populated values were preserved.`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCB1000RImport(process.argv.includes('--apply')).catch(error => { console.error(error instanceof Error ? error.message : 'Import failed'); process.exitCode = 1 })
}
