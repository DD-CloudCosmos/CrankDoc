import { it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { BikeView } from '@/lib/garageBikes'
import { BikeWorkspace } from './BikeWorkspace'
const actions = vi.hoisted(() => ({ saveBike: vi.fn(), loadBikes: vi.fn(), setArchived: vi.fn(), deleteBike: vi.fn(), importModels: vi.fn() }))
vi.mock('../actions', () => actions)
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
const bike: BikeView = { id: 'one', motorcycleId: null, nickname: 'Weekend bike', make: 'Honda', model: 'Custom', year: null, variant: '', market: '', registration: 'PRIVATE', mileageKm: null, archivedAt: null, photoPath: null, libraryImageUrl: null, modelReferenceUrl: null }
beforeEach(() => vi.clearAllMocks())
  it('requires explicit confirmation before removal', async () => {
    actions.deleteBike.mockResolvedValue(undefined)
    render(<BikeWorkspace bike={bike} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Bike details' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove bike' }))
    expect(actions.deleteBike).not.toHaveBeenCalled()
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel removal' }))
    expect(actions.deleteBike).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Remove bike' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm removal' }))
    await waitFor(() => expect(actions.deleteBike).toHaveBeenCalledTimes(1))
  })

  it('does not invent maintenance or reference for custom bikes', () => {
    render(<BikeWorkspace bike={bike} />)
    expect(screen.getByText('No maintenance recorded')).toBeInTheDocument()
    expect(screen.getByText(/Reference unavailable/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: 'Maintenance' }))
    expect(screen.getByText(/Maintenance logging is coming/)).toBeInTheDocument()
  })
it('restores archived bikes without removing their records', async () => {
  actions.setArchived.mockResolvedValue(undefined)
  render(<BikeWorkspace bike={{ ...bike, archivedAt: '2026-10-10' }} />)
  fireEvent.click(screen.getByRole('radio', { name: 'Bike details' }))
  fireEvent.click(screen.getByRole('button', { name: 'Restore bike' }))
  await waitFor(() => expect(actions.setArchived).toHaveBeenCalledWith('one', false, expect.anything()))
  expect(actions.deleteBike).not.toHaveBeenCalled()
  await waitFor(() => expect(screen.getByRole('button', { name: 'Archive bike' })).toBeInTheDocument())
})
