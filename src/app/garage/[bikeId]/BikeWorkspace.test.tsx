import { it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import type { BikeView } from '@/lib/garageBikes'
import { BikeWorkspace } from './BikeWorkspace'
const actions = vi.hoisted(() => ({ saveBike: vi.fn(), loadBikes: vi.fn(), setArchived: vi.fn(), deleteBike: vi.fn(), importModels: vi.fn() }))
vi.mock('../actions', () => actions)
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
const bike: BikeView = { id: 'one', motorcycleId: null, nickname: 'Weekend bike', make: 'Honda', model: 'Custom', year: null, variant: '', market: '', registration: 'PRIVATE', mileageKm: null, archivedAt: null, photoPath: null, libraryImageUrl: null, modelReferenceUrl: null }
beforeEach(() => vi.resetAllMocks())
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

it.each([false, true])('keeps an unsaved Details draft across tabs, including failed saves (%s)', async fail => {
  if (fail) actions.saveBike.mockRejectedValueOnce(new Error('Save failed'))
  render(<BikeWorkspace bike={bike} />)
  fireEvent.click(screen.getByRole('radio', { name: 'Bike details' }))
  fireEvent.change(screen.getByLabelText('Nickname'), { target: { value: 'Unsaved nickname' } })
  fireEvent.change(screen.getByLabelText('Mileage'), { target: { value: '321' } })
  if (fail) {
    fireEvent.click(screen.getByRole('button', { name: 'Save bike' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Save failed')
  }
  fireEvent.click(screen.getByRole('radio', { name: 'Overview' }))
  fireEvent.click(screen.getByRole('radio', { name: 'Maintenance' }))
  fireEvent.click(screen.getByRole('radio', { name: 'Bike details' }))
  expect(screen.getByLabelText('Nickname')).toHaveValue('Unsaved nickname')
  expect(screen.getByLabelText('Mileage')).toHaveValue(321)
  if (fail) expect(screen.getByRole('alert')).toHaveTextContent('Save failed')
})
it('coordinates pending saves and archives so later completion cannot overwrite edited values', async () => {
  let save!: (value: BikeView) => void
  let archive!: () => void
  actions.saveBike.mockImplementationOnce(() => new Promise(done => { save = done }))
  actions.setArchived.mockImplementationOnce(() => new Promise<void>(done => { archive = done }))
  render(<BikeWorkspace bike={bike} />)
  fireEvent.click(screen.getByRole('radio', { name: 'Bike details' }))
  fireEvent.change(screen.getByLabelText('Nickname'), { target: { value: 'Edited nickname' } })
  fireEvent.change(screen.getByLabelText('Mileage'), { target: { value: '456' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save bike' }))
  await waitFor(() => expect(actions.saveBike).toHaveBeenCalledTimes(1))
  expect(screen.getByRole('button', { name: 'Archive bike' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Archive bike' }))
  expect(actions.setArchived).not.toHaveBeenCalled()
  await act(async () => save({ ...bike, nickname: 'Edited nickname', mileageKm: 456 }))
  fireEvent.click(screen.getByRole('button', { name: 'Archive bike' }))
  await waitFor(() => expect(actions.setArchived).toHaveBeenCalledTimes(1))
  expect(screen.getByRole('button', { name: 'Save bike' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Save bike' }))
  expect(actions.saveBike).toHaveBeenCalledTimes(1)
  await act(async () => archive())
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Edited nickname')
  fireEvent.click(screen.getByRole('radio', { name: 'Overview' }))
  expect(screen.getByText('456 km')).toBeInTheDocument()
  expect(screen.getByText('Archived bike')).toBeInTheDocument()
})
