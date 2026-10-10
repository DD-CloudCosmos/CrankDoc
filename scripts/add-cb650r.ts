/** Add the verified 2023 reference without reseeding or replacing existing records. */
import { config } from 'dotenv'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { cb650r, cb650rServiceIntervals } from '../src/lib/cb650r'
import type { Database, Motorcycle, MotorcycleImage, ServiceInterval } from '../src/types/database.types'

type ExistingBike = Pick<Motorcycle, 'id' | 'make' | 'model' | 'year_start' | 'year_end'> & Partial<Motorcycle>
type ExistingInterval = Pick<ServiceInterval, 'motorcycle_id' | 'service_name'>
type ExistingImage = Pick<MotorcycleImage, 'motorcycle_id' | 'image_url' | 'is_primary'>

export function planCB650RImport(bikes: ExistingBike[], intervals: ExistingInterval[] = [], images: ExistingImage[] = []) {
  const existing = bikes.find(bike => bike.make === 'Honda' && ['CB650R', 'CB650RA'].includes(bike.model) && bike.year_start === 2023 && bike.year_end === 2023)
  const bikeId = existing?.id ?? cb650r.id
  const { created_at: _createdAt, ...record } = cb650r
  const { id: _id, make: _make, model: _model, year_start: _start, year_end: _end, ...specs } = record
  const differentPower = existing?.horsepower != null && existing.horsepower !== cb650r.horsepower
  const missing = existing ? Object.fromEntries(Object.entries(specs).filter(([key, value]) => value !== null && existing[key as keyof Motorcycle] == null && !(differentPower && key === 'torque_nm'))) : {}
  return {
    motorcycles: existing ? [] : [record],
    updates: Object.keys(missing).length ? [{ id: bikeId, values: missing as Database['public']['Tables']['motorcycles']['Update'] }] : [],
    intervals: cb650rServiceIntervals.filter(item => !intervals.some(saved => saved.motorcycle_id === bikeId && saved.service_name === item.service_name)).map(item => {
      const { created_at: _createdAt, ...row } = item
      return { ...row, motorcycle_id: bikeId }
    }),
    images: images.some(item => item.motorcycle_id === bikeId && item.image_url === cb650r.image_url) ? [] : [{
      id: 'b4660699-fb60-4f70-b5c0-2023cb650a01', motorcycle_id: bikeId, image_url: cb650r.image_url!,
      alt_text: '2023 Honda CB650RA reference illustration in red, with round LED headlight and two-sided swingarm',
      source_attribution: 'AI-generated CrankDoc illustration guided by Honda’s 2023 European CB650R model photograph.',
      is_primary: !images.some(item => item.motorcycle_id === bikeId && item.is_primary),
    }],
  }
}

export async function runCB650RImport(apply = false) {
  config({ path: resolve(process.cwd(), '.env.local'), quiet: true })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key || /your|placeholder|example/i.test(url + key)) {
    if (apply) throw new Error('Configure the database URL and service-role key before applying the import.')
    console.log('Offline preview only: credentials are missing or placeholders. No database writes.')
    console.log(JSON.stringify(planCB650RImport([]), null, 2))
    return
  }
  const client = createClient<Database>(url, key)
  const bikes = await client.from('motorcycles').select('*').eq('make', 'Honda').in('model', ['CB650R', 'CB650RA']).eq('year_start', 2023).eq('year_end', 2023)
  if (bikes.error) throw new Error(bikes.error.message)
  const bikeId = bikes.data?.[0]?.id ?? cb650r.id
  const [intervals, images] = await Promise.all([
    client.from('service_intervals').select('motorcycle_id,service_name').eq('motorcycle_id', bikeId),
    client.from('motorcycle_images').select('motorcycle_id,image_url,is_primary').eq('motorcycle_id', bikeId),
  ])
  for (const result of [intervals, images]) if (result.error) throw new Error(result.error.message)
  const plan = planCB650RImport(bikes.data ?? [], intervals.data ?? [], images.data ?? [])
  console.log(JSON.stringify(plan, null, 2))
  if (!apply) return
  if (plan.motorcycles.length) {
    const result = await client.from('motorcycles').insert(plan.motorcycles)
    if (result.error) throw new Error(result.error.message)
  }
  for (const update of plan.updates) {
    const result = await client.from('motorcycles').update(update.values).eq('id', update.id)
    if (result.error) throw new Error(result.error.message)
  }
  if (plan.intervals.length) {
    const result = await client.from('service_intervals').insert(plan.intervals)
    if (result.error) throw new Error(result.error.message)
  }
  if (plan.images.length) {
    const result = await client.from('motorcycle_images').insert(plan.images)
    if (result.error) throw new Error(result.error.message)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCB650RImport(process.argv.includes('--apply')).catch(error => { console.error(error instanceof Error ? error.message : 'Import failed'); process.exitCode = 1 })
}
