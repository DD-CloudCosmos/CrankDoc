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
it('shows each physical bike’s latest work, date and real status instead of the empty claim',()=>{
 render(<><GarageBikeCard bike={{...bike,latestJob:{id:'job',title:'Oil changed',date:'2026-10-09',status:'completed'}}} /><GarageBikeCard bike={{...bike,id:'two',nickname:'Commuter',latestJob:{id:'other',title:'Brake check',date:'2026-10-08',status:'partial'}}} /><GarageBikeCard bike={{...bike,id:'three',nickname:'New bike'}} /></>)
 expect(screen.getByText('Oil changed · 2026-10-09 · Completed')).toBeInTheDocument()
 expect(screen.getByText('Brake check · 2026-10-08 · Partial')).toBeInTheDocument()
 expect(screen.getAllByText('No maintenance recorded')).toHaveLength(1)
})
