import { it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { BikeView } from '@/lib/garageBikes'
import { ImportGarage } from './ImportGarage'
import { GARAGE_STORAGE_KEY } from '@/lib/garage'
const actions = vi.hoisted(() => ({ saveBike: vi.fn(), loadBikes: vi.fn(), setArchived: vi.fn(), deleteBike: vi.fn(), importModels: vi.fn() }))
vi.mock('./actions', () => actions)
const bike: BikeView = { id: 'one', motorcycleId: null, nickname: 'Weekend bike', make: 'Honda', model: 'Custom', year: null, variant: '', market: '', registration: 'PRIVATE', mileageKm: null, archivedAt: null, photoPath: null, libraryImageUrl: null, modelReferenceUrl: null }
beforeEach(() => vi.clearAllMocks())
  it('cancels without importing or changing browser storage', () => {
    localStorage.setItem(GARAGE_STORAGE_KEY, JSON.stringify({ bikeIds: ['one'], skill: 'pro', onboarded: true }))
    const onImport = vi.fn()
    render(<ImportGarage selectedModelIds={['one']} onImport={onImport} />)
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }))
    expect(onImport).not.toHaveBeenCalled()
    expect(JSON.parse(localStorage.getItem(GARAGE_STORAGE_KEY)!)).toEqual({ bikeIds: ['one'], skill: 'pro', onboarded: true })
  })

  it('shows partial failures and retries only unsuccessful models', async () => {
    const onImport = vi.fn().mockResolvedValueOnce({ bikes: [bike], failed: ['missing'] }).mockResolvedValueOnce({ bikes: [], failed: ['missing'] })
    render(<ImportGarage selectedModelIds={['one', 'missing']} onImport={onImport} />)
    fireEvent.click(screen.getByRole('button', { name: 'Import browser selections' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('missing')
    fireEvent.click(screen.getByRole('button', { name: 'Retry failed imports' }))
    await waitFor(() => expect(onImport).toHaveBeenLastCalledWith(['missing']))
  })
it('retains import selections after a request failure and retries explicitly', async () => {
  const onImport = vi.fn().mockRejectedValueOnce(new Error('Connection lost')).mockResolvedValueOnce({ bikes: [bike], failed: [] })
  render(<ImportGarage selectedModelIds={['one']} onImport={onImport} />)
  fireEvent.click(screen.getByRole('button', { name: 'Import browser selections' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Connection lost')
  fireEvent.click(screen.getByRole('button', { name: 'Import browser selections' }))
  expect(await screen.findByRole('status')).toHaveTextContent('1 bike imported')
  expect(onImport).toHaveBeenLastCalledWith(['one'])
})
