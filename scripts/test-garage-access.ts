import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { createLocalTestClients, loadGarageTestEnv } from './garage-test-env'
import { addBike, archiveBike, editBike, getBike, importSelectedModels, listBikes, removeBike } from '../src/lib/garageRepository.server'

async function main() {
  const { a, b, userA, userB, modelId, cleanup } = await createLocalTestClients()
  const accountA = { client: a, userId: userA }
  const accountB = { client: b, userId: userB }
  const input = { motorcycleId: modelId, nickname: '', make: 'Honda', model: 'CB650RA', year: 2023, variant: '', market: '', registration: '', mileageKm: 0 }
  try {
    const id = crypto.randomUUID()
    const bike = await addBike(accountA, input, id)
    assert.equal(bike.id, id)
    assert.equal(bike.modelReferenceUrl, '/bikes/honda-cb650ra-2023')
    assert.ok(bike.libraryImageUrl)
    assert.deepEqual(await addBike(accountA, input, id), bike)
    assert.equal((await listBikes(accountA)).length, 1)
    assert.deepEqual(await listBikes(accountB), [])
    assert.equal(await getBike(accountB, id), null)
    assert.deepEqual((await b.from('garage_bikes').select('*').eq('id', id)).data, [])
    assert.ok((await b.from('garage_bikes').insert({ id: crypto.randomUUID(), owner_id: userA, make: 'Honda', model: 'CB650RA' })).error)
    assert.ok((await a.from('garage_bikes').update({ owner_id: userB }).eq('id', id)).error)
    for (const result of [await b.from('garage_bikes').update({ nickname: 'Stolen' }).eq('id', id).select(), await b.from('garage_bikes').delete().eq('id', id).select()]) {
      assert.deepEqual(result.data, [])
    }
    await assert.rejects(editBike(accountB, id, input))
    await assert.rejects(archiveBike(accountB, id, true))
    await assert.rejects(removeBike(accountB, id))
    const { url, anonKey } = loadGarageTestEnv()
    const anonymous = createClient(url, anonKey, { auth: { persistSession: false } })
    assert.ok((await anonymous.from('garage_bikes').select('*')).error)
    assert.ok((await anonymous.from('garage_bikes').insert({ id: crypto.randomUUID(), owner_id: userA, make: 'Honda', model: 'CB650RA' })).error)
    assert.ok((await anonymous.from('garage_bikes').update({ nickname: 'Stolen' }).eq('id', id)).error)
    assert.ok((await anonymous.from('garage_bikes').delete().eq('id', id)).error)
    for (const invalid of [{ mileage_km: -1 }, { year: 1884 }, { make: '' }, { make: 'a' + ' '.repeat(120) }, { nickname: 'a'.repeat(81) }]) {
      assert.ok((await a.from('garage_bikes').insert({ id: crypto.randomUUID(), owner_id: userA, make: 'Honda', model: 'Custom', ...invalid })).error)
    }
    await assert.rejects(addBike(accountA, { ...input, year: 2024 }, crypto.randomUUID()))
    await assert.rejects(editBike(accountA, id, { ...input, year: 2022 }))
    const unknown = await addBike(accountA, { ...input, year: null }, crypto.randomUUID())
    assert.ok(unknown.libraryImageUrl)
    assert.equal(unknown.modelReferenceUrl, null)
    await addBike(accountA, input, crypto.randomUUID())
    assert.equal((await listBikes(accountA)).length, 3)
    const changed = await editBike(accountA, id, { ...input, nickname: 'Mine' })
    assert.equal(changed.nickname, 'Mine')
    await archiveBike(accountA, id, true)
    assert.equal((await listBikes(accountA, true)).length, 1)
    await archiveBike(accountA, id, false)
    assert.equal((await listBikes(accountA, true)).length, 0)
    const firstImport = await importSelectedModels(accountA, [modelId, modelId])
    const secondImport = await importSelectedModels(accountA, [modelId])
    assert.equal(firstImport.length, 1)
    assert.equal(firstImport[0].id, secondImport[0].id)
    await removeBike(accountA, id)
    assert.equal(await getBike(accountA, id), null)
    console.log('PASS: local ownership, anonymous denial, validation, same-model bikes, year scope, stable retries, import retries, archive/restore, delete')
  } finally { await cleanup() }
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Local test failed'); process.exitCode = 1 })
