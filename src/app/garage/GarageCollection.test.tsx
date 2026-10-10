import { it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import type { BikeView } from '@/lib/garageBikes'
import { PrivateGarage } from './PrivateGarage'
import { GarageCollection } from './GarageCollection'
const auth = vi.hoisted(() => ({ getUser: vi.fn(), onAuthStateChange: vi.fn() }))
vi.mock('@/lib/supabase/auth-browser', () => ({ createAuthBrowserClient: () => ({ auth }) }))
const actions = vi.hoisted(() => ({ saveBike: vi.fn(), loadBikes: vi.fn(), setArchived: vi.fn(), deleteBike: vi.fn(), importModels: vi.fn() }))
vi.mock('./actions', () => actions)
vi.mock('@/hooks/useGarage', () => ({ useGarage: () => ({ garage: { bikeIds: [], skill: 'beginner' } }) }))
const bike: BikeView = { id: 'one', motorcycleId: null, nickname: 'Weekend bike', make: 'Honda', model: 'Custom', year: null, variant: '', market: '', registration: 'PRIVATE', mileageKm: null, archivedAt: null, photoPath: null, libraryImageUrl: null, modelReferenceUrl: null }
beforeEach(() => { vi.clearAllMocks(); auth.getUser.mockResolvedValue({ data: { user: { id: 'owner' } }, error: null }); auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }) })
  it('shows archived bikes only after the explicit archived view is chosen', async () => {
    actions.loadBikes.mockResolvedValue([{ ...bike, archivedAt: '2026-10-10' }])
    render(<GarageCollection initialBikes={[]} />)
    expect(screen.queryByText('Weekend bike')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: 'Archived' }))
    expect(await screen.findByText('Weekend bike')).toBeInTheDocument()
    expect(actions.loadBikes).toHaveBeenCalledWith(true, expect.anything())
  })

it('reconciles saved props when an already mounted active collection receives fresh route data', () => {
  const { rerender } = render(<GarageCollection initialBikes={[bike]} />)
  rerender(<GarageCollection initialBikes={[{ ...bike, nickname: 'Updated name', mileageKm: 123 }]} />)
  expect(screen.queryByText('Weekend bike')).not.toBeInTheDocument()
  expect(screen.getByText('Updated name')).toBeInTheDocument()
  expect(screen.getByText('123 km')).toBeInTheDocument()
  rerender(<GarageCollection initialBikes={[]} />)
  expect(screen.queryByText('Updated name')).not.toBeInTheDocument()
})
it('reloads a restored collection before showing cards and removes deleted or archived records', async () => {
  actions.loadBikes.mockResolvedValueOnce([bike])
  render(<PrivateGarage ownerId="owner"><GarageCollection initialBikes={[bike]} /></PrivateGarage>)
  await waitFor(() => expect(screen.getByText('Weekend bike')).toBeVisible())
  let resolve!: (bikes: BikeView[]) => void
  actions.loadBikes.mockImplementationOnce(() => new Promise(done => { resolve = done }))
  fireEvent(window, new Event('pagehide'))
  fireEvent(window, new Event('pageshow'))
  await waitFor(() => expect(actions.loadBikes).toHaveBeenCalledTimes(2))
  expect(screen.queryByText('Weekend bike')).not.toBeInTheDocument()
  await act(async () => resolve([]))
  await waitFor(() => expect(screen.getByText('Your garage is empty. Add your first bike.')).toBeVisible())
  expect(actions.loadBikes).toHaveBeenLastCalledWith(false, 'owner')
})

it('does not show stale cards when a restored collection reload fails', async () => {
  actions.loadBikes.mockResolvedValueOnce([bike]).mockRejectedValueOnce(new Error('Could not load bikes'))
  render(<PrivateGarage ownerId="owner"><GarageCollection initialBikes={[bike]} /></PrivateGarage>)
  await waitFor(() => expect(screen.getByText('Weekend bike')).toBeVisible())
  fireEvent(window, new Event('pagehide')); fireEvent(window, new Event('pageshow'))
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load bikes')
  expect(screen.queryByText('Weekend bike')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Retry loading bikes' })).toBeEnabled()
})

it('reconciles a same-document back/forward restoration without a pageshow event', async () => {
  actions.loadBikes.mockResolvedValueOnce([bike]).mockResolvedValueOnce([{ ...bike, nickname: 'Updated elsewhere', mileageKm: 789 }])
  render(<PrivateGarage ownerId="owner"><GarageCollection initialBikes={[bike]} /></PrivateGarage>)
  await waitFor(() => expect(screen.getByText('Weekend bike')).toBeVisible())
  fireEvent.popState(window)
  await waitFor(() => expect(screen.getByText('Updated elsewhere')).toBeVisible())
  expect(screen.queryByText('Weekend bike')).not.toBeInTheDocument()
  expect(screen.getByText('789 km')).toBeVisible()
})
it('reloads a restored archived view when fresh route props only contain active bikes', async () => {
  actions.loadBikes.mockResolvedValueOnce([{ ...bike, archivedAt: '2026-10-10' }]).mockResolvedValueOnce([])
  const { rerender } = render(<GarageCollection initialBikes={[]} />)
  fireEvent.click(screen.getByRole('radio', { name: 'Archived' }))
  expect(await screen.findByText('Weekend bike')).toBeInTheDocument()
  rerender(<GarageCollection initialBikes={[bike]} />)
  await waitFor(() => expect(screen.queryByText('Weekend bike')).not.toBeInTheDocument())
  expect(screen.getByRole('radio', { name: 'Archived' })).toHaveAttribute('aria-checked', 'true')
  expect(screen.getByText('No archived bikes.')).toBeInTheDocument()
})
