import { it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { BikeView } from '@/lib/garageBikes'
import { BikeForm } from './BikeForm'
import { GarageCollection } from './GarageCollection'
const actions = vi.hoisted(() => ({ saveBike: vi.fn(), loadBikes: vi.fn(), setArchived: vi.fn(), deleteBike: vi.fn(), importModels: vi.fn() }))
vi.mock('./actions', () => actions)
vi.mock('@/hooks/useGarage', () => ({ useGarage: () => ({ garage: { bikeIds: [], skill: 'beginner' } }) }))
const bike: BikeView = { id: 'one', motorcycleId: null, nickname: 'Weekend bike', make: 'Honda', model: 'Custom', year: null, variant: '', market: '', registration: 'PRIVATE', mileageKm: null, archivedAt: null, photoPath: null, libraryImageUrl: null, modelReferenceUrl: null }
beforeEach(() => vi.clearAllMocks())
  it.each([null, bike])('retains add/edit input after a failed save', async initial => {
    const onSave = vi.fn().mockRejectedValue(new Error('Sign in again to save.'))
    render(<BikeForm initial={initial} onSave={onSave} />)
    fireEvent.change(screen.getByLabelText('Make'), { target: { value: 'Honda' } })
    fireEvent.change(screen.getByLabelText('Model'), { target: { value: 'Custom' } })
    fireEvent.change(screen.getByLabelText('Nickname'), { target: { value: 'Keep this draft' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save bike' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Sign in again')
    expect(screen.getByLabelText('Nickname')).toHaveValue('Keep this draft')
    fireEvent.click(screen.getByRole('button', { name: 'Save bike' }))
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2))
    expect(onSave.mock.calls[0][1]).toBe(onSave.mock.calls[1][1])
  })

it('converts miles for storage and displays miles without changing the bike record', async () => {
  const onSave = vi.fn().mockResolvedValue(bike)
  const { unmount } = render(<BikeForm initial={null} onSave={onSave} />)
  fireEvent.change(screen.getByLabelText('Make'), { target: { value: 'Honda' } })
  fireEvent.change(screen.getByLabelText('Model'), { target: { value: 'Custom' } })
  fireEvent.change(screen.getByLabelText('Mileage unit'), { target: { value: 'mi' } })
  fireEvent.change(screen.getByLabelText('Mileage'), { target: { value: '100' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save bike' }))
  await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ mileageKm: 160.934 }), expect.any(String)))
  unmount()
  render(<GarageCollection initialBikes={[{ ...bike, mileageKm: 1.609344 }]} />)
  fireEvent.change(screen.getByLabelText('Display mileage'), { target: { value: 'mi' } })
  expect(screen.getByText('1 mi')).toBeInTheDocument()
})
