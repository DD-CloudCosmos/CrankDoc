import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { createLocalTestClients } from './garage-test-env'
import { addBike, archiveBike, getBike, importSelectedModels, listBikes } from '../src/lib/garageRepository.server'
async function main() {
  const { a, b, userA, userB, modelId, cleanup } = await createLocalTestClients()
  const accountA = { client: a, userId: userA }, accountB = { client: b, userId: userB }
  try {
    const first = (await importSelectedModels(accountA, [modelId]))[0]
    const repeated = (await importSelectedModels(accountA, [modelId, modelId]))[0]
    assert.equal(first.id, repeated.id)
    assert.equal(first.year, null); assert.equal(first.mileageKm, null)
    assert.ok(first.libraryImageUrl); assert.equal(first.modelReferenceUrl, null)
    const { data, error } = await a.from('garage_bikes').select('id, import_key').eq('owner_id', userA)
    assert.equal(error, null); assert.equal(data?.length, 1)
    assert.equal(data?.[0].import_key, `local-v1:${modelId}`)
    const missing = crypto.randomUUID()
    await assert.rejects(importSelectedModels(accountA, [missing]))
    assert.equal((await listBikes(accountA)).length, 1)
    await archiveBike(accountA, first.id, true)
    assert.equal((await importSelectedModels(accountA, [modelId]))[0].id, first.id)
    assert.equal((await listBikes(accountA)).length, 0)
    assert.equal((await listBikes(accountA, true)).length, 1)
    const other = (await importSelectedModels(accountB, [modelId]))[0]
    assert.notEqual(other.id, first.id)
    assert.equal(await getBike(accountB, first.id), null)
    const ordinary = await addBike(accountA, { ...first, year: 2023 }, crypto.randomUUID())
    assert.notEqual(ordinary.id, first.id)
    assert.equal(ordinary.modelReferenceUrl, '/bikes/honda-cb650ra-2023')
    assert.ok(existsSync(`src/app${ordinary.modelReferenceUrl}/page.tsx`))
    console.log('PASS: local per-owner import retries, one row, missing-model failure, archived retention, unknown facts, duplicate ordinary add and actual Honda route')
  } finally { await cleanup() }
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Local import test failed'); process.exitCode = 1 })
