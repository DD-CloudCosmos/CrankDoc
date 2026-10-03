/** Add the supported SC60 reference without running the destructive reseed. */
import { config } from 'dotenv'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { cb1000r, cb1000rDocuments } from '../src/lib/cb1000r'
import type { Database, Motorcycle } from '../src/types/database.types'

type ExistingBike = Pick<Motorcycle, 'id' | 'make' | 'model' | 'year_start' | 'year_end'>
type ExistingDocument = { motorcycle_id: string; file_url: string }

export function planCB1000RImport(bikes: ExistingBike[], docs: ExistingDocument[]) {
  const existing = bikes.find(bike => bike.make === cb1000r.make && bike.model === cb1000r.model && bike.year_start === 2008 && bike.year_end === 2008)
  const bikeId = existing?.id ?? cb1000r.id
  const { created_at: _createdAt, ...record } = cb1000r
  return {
    motorcycles: existing ? [] : [record],
    documents: cb1000rDocuments.filter(doc => !docs.some(existingDoc => existingDoc.motorcycle_id === bikeId && existingDoc.file_url === doc.file_url)).map(doc => {
      const { created_at: _documentCreatedAt, ...document } = doc
      return { ...document, motorcycle_id: bikeId }
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
  const bikes = await client.from('motorcycles').select('id,make,model,year_start,year_end').eq('make', 'Honda').eq('model', 'CB1000R')
  if (bikes.error) throw new Error(bikes.error.message)
  const docs = await client.from('technical_documents').select('motorcycle_id,file_url')
  if (docs.error) throw new Error(docs.error.message)
  const plan = planCB1000RImport(bikes.data ?? [], docs.data ?? [])
  if (plan.motorcycles.length) {
    const result = await client.from('motorcycles').insert(plan.motorcycles)
    if (result.error) throw new Error(result.error.message)
  }
  if (plan.documents.length) {
    const result = await client.from('technical_documents').insert(plan.documents)
    if (result.error) throw new Error(result.error.message)
  }
  console.log(`Added ${plan.motorcycles.length} bike and ${plan.documents.length} diagrams. Existing records were preserved.`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCB1000RImport(process.argv.includes('--apply')).catch(error => { console.error(error instanceof Error ? error.message : 'Import failed'); process.exitCode = 1 })
}
