import { existsSync } from 'node:fs'
import cb1000rRecord from '../../data/motorcycles/honda-cb1000r-2008.json'
import cb650raRecord from '../../data/motorcycles/honda-cb650ra-2023.json'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AccountContext } from './account'
import { addBike, archiveBike, editBike, getBike, importSelectedModels, listBikes, removeBike } from './garageRepository.server'
const id = '00000000-0000-4000-8000-000000000001'
const modelId = '00000000-0000-4000-8000-000000000002'
const input = { motorcycleId: null, nickname: '', make: 'Honda', model: 'Custom', year: null, variant: '', market: '', registration: '', mileageKm: null }
const row = { id, owner_id: 'owner', motorcycle_id: null, nickname: '', make: 'Honda', model: 'Custom', year: null, variant: '', market: '', registration: '', mileage_km: null, archived_at: null, photo_path: null, import_key: null, created_at: '2026-10-10' }
const model = { id: modelId, make: 'Honda', model: 'CB650RA', year_start: 2023, year_end: 2023, image_url: '/fallback.webp' }
type Result = { data: unknown; error: null | { code?: string } }
let responses: Result[]
let queries: { table: string; eq: ReturnType<typeof vi.fn>; insert: ReturnType<typeof vi.fn>; upsert: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }[]
const client = { from: (table: string) => {
  const response = responses.shift()
  if (!response) throw new Error('Missing test response')
  const query = { table, eq: vi.fn(), insert: vi.fn(), upsert: vi.fn(), update: vi.fn(), select: vi.fn(), order: vi.fn(), is: vi.fn(), not: vi.fn(), delete: vi.fn(), limit: vi.fn(), single: vi.fn(), maybeSingle: vi.fn(), then: (resolve: (value: Result) => void) => Promise.resolve(response).then(resolve) }
  for (const key of ['eq', 'insert', 'upsert', 'update', 'select', 'order', 'is', 'not', 'delete', 'limit', 'single', 'maybeSingle'] as const) query[key].mockReturnValue(query)
  queries.push(query)
  return query
} }
const account = { client, userId: 'owner' } as unknown as AccountContext
const ok = (data: unknown): Result => ({ data, error: null })
const failure: Result = { data: null, error: {} }
beforeEach(() => { responses = []; queries = [] })
describe('owner-scoped repository', () => {
  it('lists active and archived bikes with explicit owner filters', async () => {
    responses = [ok([row]), ok([]), ok([])]
    expect(await listBikes(account)).toHaveLength(1)
    expect(await listBikes(account, true)).toEqual([])
    for (const query of queries) expect(query.eq).toHaveBeenCalledWith('owner_id', 'owner')
  })
  it('returns null for inaccessible records', async () => { responses = [ok(null)]; expect(await getBike(account, id)).toBeNull() })
  it('derives ownership and retries a stable add without overwriting', async () => {
    responses = [ok(null), ok(row), { data: null, error: { code: '23505' } }, ok(row)]
    expect((await addBike(account, input, id)).id).toBe(id)
    expect((await addBike(account, input, id)).id).toBe(id)
    expect(queries[0].insert).toHaveBeenCalledWith(expect.objectContaining({ id, owner_id: 'owner' }))
  })
  it('updates details, archives, restores, and removes using explicit ownership', async () => {
    responses = [ok(row), ok({ id }), ok({ id }), ok({ id })]
    await editBike(account, id, input)
    await archiveBike(account, id, true)
    await archiveBike(account, id, false)
    await removeBike(account, id)
    for (const query of queries) expect(query.eq).toHaveBeenCalledWith('owner_id', 'owner')
    expect(queries[1].update).toHaveBeenCalledWith({ archived_at: expect.any(String) })
    expect(queries[2].update).toHaveBeenCalledWith({ archived_at: null })
  })
  it.each(['list', 'get', 'add', 'edit', 'archive', 'remove'])('reports failed %s', async operation => {
    responses = [failure]
    const run = { list: () => listBikes(account), get: () => getBike(account, id), add: () => addBike(account, input, id), edit: () => editBike(account, id, input), archive: () => archiveBike(account, id, true), remove: () => removeBike(account, id) }[operation]!
    await expect(run()).rejects.toThrow()
  })
  it.each(['edit', 'archive', 'remove'])('does not treat zero rows as successful %s', async operation => {
    responses = [ok(null)]
    const run = { edit: () => editBike(account, id, input), archive: () => archiveBike(account, id, true), remove: () => removeBike(account, id) }[operation]!
    await expect(run()).rejects.toThrow()
  })
  it('does not treat another owner duplicate ID as a saved add', async () => {
    responses = [{ data: null, error: { code: '23505' } }, ok(null)]
    await expect(addBike(account, input, id)).rejects.toThrow()
  })
  it('uses primary image and Honda reference only within matching year scope', async () => {
    responses = [ok({ ...row, motorcycle_id: modelId, model: model.model, year: 2023 }), ok(model), ok([{ image_url: '/primary.webp' }])]
    expect(await getBike(account, id)).toMatchObject({ libraryImageUrl: '/primary.webp', modelReferenceUrl: '/bikes/honda-cb650ra-2023' })
  })
  it('uses catalogue fallback image and ID reference for another supported model', async () => {
    responses = [ok({ ...row, motorcycle_id: modelId, model: 'Other', year: 2023 }), ok({ ...model, model: 'Other' }), ok([])]
    expect(await getBike(account, id)).toMatchObject({ libraryImageUrl: '/fallback.webp', modelReferenceUrl: `/bikes/${modelId}` })
  })
  it('resolves the existing CB1000R reference', async () => {
    responses = [ok({ ...row, motorcycle_id: modelId, model: 'CB1000R', year: 2008 }), ok({ ...model, model: 'CB1000R', year_start: 2008, year_end: 2008 }), ok([])]
    expect((await getBike(account, id))?.modelReferenceUrl).toBe('/bikes/honda-cb1000r-sc60')
  })
  it('keeps a mismatched year on placeholder with no reference', async () => {
    responses = [ok({ ...row, motorcycle_id: modelId, model: model.model, year: 2024 }), ok(model)]
    expect(await getBike(account, id)).toMatchObject({ libraryImageUrl: null, modelReferenceUrl: null })
  })
  it('rejects invalid catalogue scope before mutation', async () => {
    responses = [ok(model)]
    await expect(addBike(account, { ...input, motorcycleId: modelId, model: model.model, year: 2024 }, id)).rejects.toThrow('Year outside')
    expect(queries).toHaveLength(1)
  })
  it('reports unavailable catalogue and image', async () => {
    responses = [ok({ ...row, motorcycle_id: modelId, year: 2023 }), failure]
    await expect(getBike(account, id)).rejects.toThrow('Catalogue model')
    responses = [ok({ ...row, motorcycle_id: modelId, model: model.model, year: 2023 }), ok(model), failure]
    await expect(getBike(account, id)).rejects.toThrow('Catalogue image')
  })
  it('imports unique catalogue IDs with a per-owner retry key and unknown year', async () => {
    responses = [ok(model), ok(null), ok({ ...row, motorcycle_id: modelId, model: model.model }), ok(model), ok([])]
    expect(await importSelectedModels(account, [modelId, modelId])).toHaveLength(1)
    expect(queries[1].upsert).toHaveBeenCalledWith(expect.objectContaining({ owner_id: 'owner', import_key: `local-v1:${modelId}` }), { onConflict: 'owner_id,import_key', ignoreDuplicates: true })
    expect(queries[2].eq).toHaveBeenCalledWith('owner_id', 'owner')
  })
  it('reports failed import write or read', async () => {
    responses = [ok(model), failure]
    await expect(importSelectedModels(account, [modelId])).rejects.toThrow('Could not import')
    responses = [ok(model), ok(null), failure]
    await expect(importSelectedModels(account, [modelId])).rejects.toThrow('Could not load imported')
  })
})

describe('garage catalogue mapping and browser imports', () => {
  it('uses library art for a linked unknown-year model without claiming reference coverage', async () => {
    responses = [ok({ ...row, motorcycle_id: modelId, model: model.model }), ok(model), ok([])]
    expect(await getBike(account, id)).toMatchObject({ libraryImageUrl: '/fallback.webp', modelReferenceUrl: null, year: null })
  })
  it('uses the specified import key', async () => {
    responses = [ok(model), ok(null), ok({ ...row, motorcycle_id: null })]
    await importSelectedModels(account, [modelId])
    expect(queries[1].upsert).toHaveBeenCalledWith(expect.objectContaining({ import_key: `local-v1:${modelId}` }), expect.anything())
  })
})

describe('actual Honda catalogue records', () => {
  it.each([[cb1000rRecord, '/bikes/honda-cb1000r-sc60'], [cb650raRecord, '/bikes/honda-cb650ra-2023']] as const)('maps the checked-in record to an existing route', async (record, route) => {
    responses = [ok({ ...row, motorcycle_id: record.id, make: record.make, model: record.model, year: record.year_start }), ok(record), ok([])]
    expect((await getBike(account, id))?.modelReferenceUrl).toBe(route)
    expect(existsSync(`src/app${route}/page.tsx`)).toBe(true)
  })
})
it('loads latest work per owned physical bike, and falls back when the latest record was deleted',async()=>{
 const latest={id:'job',title:'Oil changed',job_date:'2026-10-09',status:'completed'}
 responses=[ok([row,{...row,id:modelId}]),ok([latest]),ok([])]
 const bikes=await listBikes(account)
 expect(bikes[0]).toMatchObject({latestJob:{id:'job',title:'Oil changed',date:'2026-10-09',status:'completed'}})
 expect(bikes[1].latestJob).toBeNull()
 const histories=queries.filter(query=>query.table==='maintenance_jobs')
 expect(histories[0].eq).toHaveBeenCalledWith('bike_id',id)
 expect(histories[1].eq).toHaveBeenCalledWith('bike_id',modelId)
 for(const query of histories) expect(query.eq).toHaveBeenCalledWith('owner_id','owner')
 responses=[ok([row]),ok([{...latest,id:'previous',title:'Earlier work'}])]
 expect((await listBikes(account))[0].latestJob?.title).toBe('Earlier work')
})

it('omits untouched mileage from the atomic update, preserving other-device logs',async()=>{
 responses=[ok({...row,mileage_km:15000}),ok({...row,mileage_km:11000})]
 await editBike(account,id,{...input,mileageKm:12000,mileageEdited:false})
 expect(queries[0].update.mock.calls[0][0]).not.toHaveProperty('mileage_km')
 await editBike(account,id,{...input,mileageKm:11000,mileageEdited:true})
 expect(queries[1].update.mock.calls[0][0]).toHaveProperty('mileage_km',11000)
})
