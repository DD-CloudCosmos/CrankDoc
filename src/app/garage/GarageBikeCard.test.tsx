import { it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { BikeView } from '@/lib/garageBikes'
import { GarageBikeCard } from './GarageBikeCard'
const actions = vi.hoisted(() => ({ saveBike: vi.fn(), loadBikes: vi.fn(), setArchived: vi.fn(), deleteBike: vi.fn(), importModels: vi.fn() }))
vi.mock('./actions', () => actions)
const bike: BikeView = { id: 'one', motorcycleId: null, nickname: 'Weekend bike', make: 'Honda', model: 'Custom', year: null, variant: '', market: '', registration: 'PRIVATE', mileageKm: null, archivedAt: null, photoPath: null, libraryImageUrl: null, modelReferenceUrl: null }
beforeEach(() => vi.clearAllMocks())
  it('links duplicate models to distinct physical IDs, without registration', () => {
    render(<><GarageBikeCard bike={bike} /><GarageBikeCard bike={{ ...bike, id: 'two', nickname: 'Commuter' }} /></>)
    expect(screen.getByRole('link', { name: /Weekend bike/ })).toHaveAttribute('href', '/garage/one')
    expect(screen.getByRole('link', { name: /Commuter/ })).toHaveAttribute('href', '/garage/two')
    expect(screen.getAllByText('Mileage not recorded')).toHaveLength(2)
    expect(screen.getAllByRole('img')[0]).not.toHaveAttribute('src')
    expect(screen.queryByText('PRIVATE')).not.toBeInTheDocument()
  })
