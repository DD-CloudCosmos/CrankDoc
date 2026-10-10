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

it('refreshes pristine details but preserves an unsaved draft when the bike changes remotely',()=>{
 const initial={motorcycleId:null,nickname:'Original',make:'Honda',model:'Custom',year:null,variant:'',market:'',registration:'',mileageKm:100}
 const {rerender}=render(<BikeForm initial={initial} onSave={vi.fn()} />)
 rerender(<BikeForm initial={{...initial,nickname:'Remote',mileageKm:200}} onSave={vi.fn()} />)
 expect(screen.getByLabelText('Nickname')).toHaveValue('Remote');expect(screen.getByLabelText('Mileage')).toHaveValue(200)
 fireEvent.change(screen.getByLabelText('Nickname'),{target:{value:'Draft'}})
 rerender(<BikeForm initial={{...initial,nickname:'New remote',mileageKm:300}} onSave={vi.fn()} />)
 expect(screen.getByLabelText('Nickname')).toHaveValue('Draft');expect(screen.getByLabelText('Mileage')).toHaveValue(200)
})
it('changes linked identity deliberately, validates linked years and keeps the physical bike ID',async()=>{
 const physicalId='00000000-0000-4000-8000-000000000001'
 const models=[{id:'00000000-0000-4000-8000-000000000002',make:'Honda',model:'CB650RA',year_start:2023,year_end:2023},{id:'00000000-0000-4000-8000-000000000003',make:'Yamaha',model:'MT-07',year_start:2020,year_end:2024}]
 const initial={...bike,id:physicalId,motorcycleId:models[0].id,make:'Honda',model:'CB650RA',year:2023}
 const save=vi.fn(async input=>({...initial,...input}))
 render(<BikeForm initial={initial} models={models} onSave={save} />)
 expect(screen.getByLabelText('Make')).toHaveAttribute('readonly')
 fireEvent.click(screen.getByRole('button',{name:'Change model'}))
 fireEvent.change(screen.getByLabelText('Model from the library'),{target:{value:models[1].id}})
 fireEvent.change(screen.getByLabelText('Year'),{target:{value:'2019'}})
 fireEvent.click(screen.getByRole('button',{name:'Save bike'}))
 expect(await screen.findByRole('alert')).toHaveTextContent('Year outside catalogue model range')
 expect(save).not.toHaveBeenCalled()
 fireEvent.change(screen.getByLabelText('Year'),{target:{value:'2022'}})
 fireEvent.click(screen.getByRole('button',{name:'Save bike'}))
 await waitFor(()=>expect(save).toHaveBeenCalledWith(expect.objectContaining({motorcycleId:models[1].id,make:'Yamaha',model:'MT-07',year:2022}),physicalId))
 fireEvent.click(screen.getByRole('button',{name:'Change model'}))
 fireEvent.change(screen.getByLabelText('Model from the library'),{target:{value:''}})
 expect(screen.getByLabelText('Make')).not.toHaveAttribute('readonly')
 fireEvent.change(screen.getByLabelText('Make'),{target:{value:'Custom make'}})
 fireEvent.click(screen.getByRole('button',{name:'Save bike'}))
 await waitFor(()=>expect(save).toHaveBeenLastCalledWith(expect.objectContaining({motorcycleId:null,make:'Custom make'}),physicalId))
})
