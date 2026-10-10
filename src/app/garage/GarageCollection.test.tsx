import { it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { BikeView } from '@/lib/garageBikes'
import { GarageCollection } from './GarageCollection'
const actions = vi.hoisted(() => ({ saveBike: vi.fn(), loadBikes: vi.fn(), setArchived: vi.fn(), deleteBike: vi.fn(), importModels: vi.fn() }))
vi.mock('./actions', () => actions)
vi.mock('@/hooks/useGarage', () => ({ useGarage: () => ({ garage: { bikeIds: [], skill: 'beginner' } }) }))
const bike: BikeView = { id: 'one', motorcycleId: null, nickname: 'Weekend bike', make: 'Honda', model: 'Custom', year: null, variant: '', market: '', registration: 'PRIVATE', mileageKm: null, archivedAt: null, photoPath: null, libraryImageUrl: null, modelReferenceUrl: null }
beforeEach(() => vi.clearAllMocks())
  it('shows archived bikes only after the explicit archived view is chosen', async () => {
    actions.loadBikes.mockResolvedValue([{ ...bike, archivedAt: '2026-10-10' }])
    render(<GarageCollection initialBikes={[]} />)
    expect(screen.queryByText('Weekend bike')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: 'Archived' }))
    expect(await screen.findByText('Weekend bike')).toBeInTheDocument()
    expect(actions.loadBikes).toHaveBeenCalledWith(true, expect.anything())
  })
