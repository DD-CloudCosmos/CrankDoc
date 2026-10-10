'use server'

import { getAccount } from '@/lib/account'
import { addBike, editBike, listBikes, archiveBike, removeBike, importSelectedModels } from '@/lib/garageRepository.server'
import type { BikeInput, BikeView } from '@/lib/garageBikes'

async function accountFor(ownerId: string) {
  const account = await getAccount()
  if (!account || account.userId !== ownerId) throw new Error('Sign in again to save. Your changes have not been saved.')
  return account
}
export async function saveBike(input: BikeInput, id: string, ownerId: string, editing = false): Promise<BikeView> {
  const account = await accountFor(ownerId)
  return editing ? editBike(account, id, input) : addBike(account, input, id)
}
export async function loadBikes(archived: boolean, ownerId: string) {
  return listBikes(await accountFor(ownerId), archived)
}
export async function setArchived(id: string, archived: boolean, ownerId: string) {
  await archiveBike(await accountFor(ownerId), id, archived)
}
export async function deleteBike(id: string, confirmed: boolean, ownerId: string) {
  if (confirmed !== true) throw new Error('Confirm removal first.')
  await removeBike(await accountFor(ownerId), id)
}
export async function importModels(ids: string[], ownerId: string): Promise<{ bikes: BikeView[]; failed: string[] }> {
  const account = await accountFor(ownerId)
  const bikes: BikeView[] = []
  const failed: string[] = []
  for (const id of new Set(ids)) {
    try { bikes.push(...await importSelectedModels(account, [id])) }
    catch { failed.push(id) }
  }
  return { bikes, failed }
}
