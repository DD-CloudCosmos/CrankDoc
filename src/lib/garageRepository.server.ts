import type { AccountContext } from './account'
import { parseBikeInput, requireBikeId, validateCatalogueScope, type BikeInput, type BikeView } from './garageBikes'
import type { Motorcycle, Tables } from '@/types/database.types'

type BikeRow = Tables<'garage_bikes'>

async function catalogue(account: AccountContext, id: string): Promise<Motorcycle> {
  const { data, error } = await account.client.from('motorcycles').select('*').eq('id', id).single()
  if (error || !data) throw new Error('Catalogue model unavailable')
  return data
}

async function view(account: AccountContext, row: BikeRow): Promise<BikeView> {
  let libraryImageUrl: string | null = null
  let modelReferenceUrl: string | null = null
  if (row.motorcycle_id) {
    const model = await catalogue(account, row.motorcycle_id)
    // Catalogue changes must never attach a reference for a different year/model.
    if (model.make === row.make && model.model === row.model && (row.year === null || (row.year >= model.year_start && (model.year_end === null || row.year <= model.year_end)))) {
      const { data, error } = await account.client.from('motorcycle_images').select('image_url').eq('motorcycle_id', model.id).eq('is_primary', true).limit(1)
      if (error) throw new Error('Catalogue image unavailable')
      libraryImageUrl = data?.[0]?.image_url ?? model.image_url
      if (row.year !== null) modelReferenceUrl = `/bikes/${model.id}`
      if (model.make === 'Honda' && ['CB650R', 'CB650RA'].includes(model.model) && row.year === 2023 && model.year_start === 2023 && model.year_end === 2023) modelReferenceUrl = '/bikes/honda-cb650ra-2023'
      if (model.make === 'Honda' && ['CB1000R', 'CB1000RA'].includes(model.model) && row.year === 2008 && model.year_start === 2008 && model.year_end === 2008) modelReferenceUrl = '/bikes/honda-cb1000r-sc60'
    }
  }
  return { id: row.id, motorcycleId: row.motorcycle_id, nickname: row.nickname, make: row.make, model: row.model,
    year: row.year, variant: row.variant, market: row.market, registration: row.registration, mileageKm: row.mileage_km,
    archivedAt: row.archived_at, photoPath: row.photo_path, libraryImageUrl, modelReferenceUrl }
}

async function fields(account: AccountContext, input: BikeInput) {
  const bike = parseBikeInput(input)
  if (bike.motorcycleId) validateCatalogueScope(bike, await catalogue(account, bike.motorcycleId))
  return { motorcycle_id: bike.motorcycleId, nickname: bike.nickname, make: bike.make, model: bike.model, year: bike.year,
    variant: bike.variant, market: bike.market, registration: bike.registration, mileage_km: bike.mileageKm }
}

export async function listBikes(account: AccountContext, archived = false): Promise<BikeView[]> {
  const query = account.client.from('garage_bikes').select('*').eq('owner_id', account.userId).order('created_at').order('id')
  const { data, error } = await (archived ? query.not('archived_at', 'is', null) : query.is('archived_at', null))
  if (error) throw new Error('Could not load bikes')
  return Promise.all((data ?? []).map(async row => {
    const bike=await view(account,row)
    const latest=await account.client.from('maintenance_jobs').select('id,title,job_date,status').eq('owner_id',account.userId).eq('bike_id',row.id)
      .order('job_date',{ascending:false}).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(1)
    if(latest.error) throw new Error('Could not load latest maintenance')
    const job=latest.data?.[0]
    return {...bike,latestJob:job?{id:job.id,title:job.title,date:job.job_date,status:job.status as NonNullable<BikeView['latestJob']>['status']}:null}
  }))
}

export async function getBike(account: AccountContext, id: string): Promise<BikeView | null> {
  const { data, error } = await account.client.from('garage_bikes').select('*').eq('owner_id', account.userId).eq('id', requireBikeId(id)).maybeSingle()
  if (error) throw new Error('Could not load bike')
  return data ? view(account, data) : null
}

export async function addBike(account: AccountContext, input: BikeInput, id: string): Promise<BikeView> {
  const values = await fields(account, input)
  const { error } = await account.client.from('garage_bikes').insert({ ...values, id: requireBikeId(id), owner_id: account.userId })
  if (error && error.code !== '23505') throw new Error('Could not add bike')
  const bike = await getBike(account, id)
  if (!bike) throw new Error('Could not add bike')
  return bike
}

export async function editBike(account: AccountContext, id: string, input: BikeInput): Promise<BikeView> {
  const values = await fields(account, input)
  const { data, error } = await account.client.from('garage_bikes').update(values).eq('owner_id', account.userId).eq('id', requireBikeId(id)).select('*').single()
  if (error || !data) throw new Error('Bike not found or could not save')
  return view(account, data)
}

export async function archiveBike(account: AccountContext, id: string, archive: boolean): Promise<void> {
  const { data, error } = await account.client.from('garage_bikes').update({ archived_at: archive ? new Date().toISOString() : null }).eq('owner_id', account.userId).eq('id', requireBikeId(id)).select('id').single()
  if (error || !data) throw new Error('Bike not found or could not archive')
}

// The calling action must obtain explicit removal confirmation; archive is separate.
export async function removeBike(account: AccountContext, id: string): Promise<void> {
  const { data, error } = await account.client.from('garage_bikes').delete().eq('owner_id', account.userId).eq('id', requireBikeId(id)).select('id').single()
  if (error || !data) throw new Error('Bike not found or could not remove')
}

export async function importSelectedModels(account: AccountContext, modelIds: string[]): Promise<BikeView[]> {
  const result: BikeView[] = []
  for (const modelId of new Set(modelIds)) {
    const model = await catalogue(account, requireBikeId(modelId))
    const importKey = `local-v1:${model.id}`
    const { error } = await account.client.from('garage_bikes').upsert({ id: crypto.randomUUID(), owner_id: account.userId,
      import_key: importKey, motorcycle_id: model.id, make: model.make, model: model.model }, { onConflict: 'owner_id,import_key', ignoreDuplicates: true })
    if (error) throw new Error('Could not import bike')
    const { data, error: readError } = await account.client.from('garage_bikes').select('*').eq('owner_id', account.userId).eq('import_key', importKey).single()
    if (readError || !data) throw new Error('Could not load imported bike')
    result.push(await view(account, data))
  }
  return result
}
