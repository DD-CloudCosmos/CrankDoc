import { revalidatePath } from 'next/cache'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAccount } from '@/lib/account'
import * as repository from '@/lib/garageRepository.server'
import { saveBike, loadBikes, setArchived, deleteBike, importModels } from './actions'
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/account', () => ({ getAccount: vi.fn() }))
vi.mock('@/lib/garageRepository.server', () => ({ addBike: vi.fn(), editBike: vi.fn(), listBikes: vi.fn(), archiveBike: vi.fn(), removeBike: vi.fn(), importSelectedModels: vi.fn() }))
const input = { motorcycleId: null, nickname: '', make: 'Honda', model: 'Custom', year: null, variant: '', market: '', registration: '', mileageKm: null }
const account = { userId: 'a', client: {} } as Awaited<ReturnType<typeof getAccount>>
beforeEach(() => { vi.clearAllMocks(); vi.mocked(getAccount).mockResolvedValue(account) })
describe('garage authenticated actions', () => {
  it.each([null, { userId: 'b', client: {} }])('rejects stale drafts after logout or owner change', async value => {
    vi.mocked(getAccount).mockResolvedValue(value as typeof account)
    await expect(saveBike(input, 'id', 'a')).rejects.toThrow('Sign in again')
    await expect(loadBikes(false, 'a')).rejects.toThrow('Sign in again')
    await expect(setArchived('id', true, 'a')).rejects.toThrow('Sign in again')
    await expect(deleteBike('id', true, 'a')).rejects.toThrow('Sign in again')
    await expect(importModels(['id'], 'a')).rejects.toThrow('Sign in again')
    expect(repository.addBike).not.toHaveBeenCalled()
  })
  it('dispatches owner-scoped add/edit/archive/list and only confirmed removal', async () => {
    await saveBike(input, 'id', 'a'); await saveBike(input, 'id', 'a', true)
    expect(repository.addBike).toHaveBeenCalledWith(account, input, 'id')
    expect(repository.editBike).toHaveBeenCalledWith(account, 'id', input)
    await loadBikes(true, 'a'); await setArchived('id', true, 'a')
    expect(repository.listBikes).toHaveBeenCalledWith(account, true)
    expect(repository.archiveBike).toHaveBeenCalledWith(account, 'id', true)
    await expect(deleteBike('id', false, 'a')).rejects.toThrow('Confirm removal')
    expect(repository.removeBike).not.toHaveBeenCalled()
    await deleteBike('id', true, 'a')
    expect(repository.removeBike).toHaveBeenCalledWith(account, 'id')
  })
  it('keeps successful imports when an individual model is missing', async () => {
    vi.mocked(repository.importSelectedModels).mockResolvedValueOnce([{ id: 'saved' } as never]).mockRejectedValueOnce(new Error('Missing'))
    expect(await importModels(['valid', 'missing', 'valid'], 'a')).toEqual({ bikes: [{ id: 'saved' }], failed: ['missing'] })
    expect(repository.importSelectedModels).toHaveBeenCalledTimes(2)
  })
})

it.each(['add', 'edit', 'archive', 'remove'])('invalidates collection and bike routes after successful %s only', async operation => {
  const run = { add: () => saveBike(input, 'id', 'a'), edit: () => saveBike(input, 'id', 'a', true), archive: () => setArchived('id', true, 'a'), remove: () => deleteBike('id', true, 'a') }[operation]!
  await run()
  expect(revalidatePath).toHaveBeenCalledWith('/garage')
  expect(revalidatePath).toHaveBeenCalledWith('/garage/id')
})
it('does not invalidate routes for a failed mutation and invalidates successful partial imports', async () => {
  vi.mocked(repository.editBike).mockRejectedValueOnce(new Error('Save failed'))
  await expect(saveBike(input, 'id', 'a', true)).rejects.toThrow('Save failed')
  expect(revalidatePath).not.toHaveBeenCalled()
  vi.mocked(repository.importSelectedModels).mockResolvedValueOnce([{ id: 'imported' } as never]).mockRejectedValueOnce(new Error('Missing'))
  await importModels(['valid', 'missing'], 'a')
  expect(revalidatePath).toHaveBeenCalledWith('/garage')
  expect(revalidatePath).toHaveBeenCalledWith('/garage/imported')
})
