'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { useGarage } from '@/hooks/useGarage'
import type { BikeView } from '@/lib/garageBikes'
import { GarageBikeCard } from './GarageBikeCard'
import { BikeForm, type CatalogueOption } from './BikeForm'
import { ImportGarage } from './ImportGarage'
import { useGarageOwner, useGarageReconciliation } from './PrivateGarage'
import { loadBikes, saveBike, importModels } from './actions'

export function GarageCollection({ initialBikes, models = [] }: { initialBikes: BikeView[]; models?: CatalogueOption[] }) {
  const owner = useGarageOwner()
  const { garage } = useGarage()
  const [bikes, setBikes] = useState(initialBikes)
  const [view, setView] = useState<'active' | 'archived'>('active')
  const [unit, setUnit] = useState<'km' | 'mi'>('km')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const request = useRef(0)
  const changeView = useCallback(async (next: 'active' | 'archived') => {
    const token = ++request.current
    setView(next); setBikes([]); setError(''); setLoading(true)
    try { const result = await loadBikes(next === 'archived', owner); if (token === request.current) setBikes(result) }
    catch (error) { if (token === request.current) setError(error instanceof Error ? error.message : 'Could not load bikes.') }
    finally { if (token === request.current) setLoading(false) }
  }, [owner])
  useGarageReconciliation(useCallback(() => changeView(view), [changeView, view]))
  const currentView = useRef(view)
  useEffect(() => { currentView.current = view }, [view])
  useEffect(() => {
    if (currentView.current === 'active') { request.current++; setBikes(initialBikes); setLoading(false); setError('') }
    else void changeView('archived')
  }, [initialBikes, changeView])
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-[34px] font-semibold tracking-[-0.03em]">My Garage</h1><Button onClick={() => setAdding(!adding)}>{adding ? 'Cancel adding' : 'Add bike'}</Button></div>
    <ImportGarage selectedModelIds={garage?.bikeIds ?? []} onImport={async ids => {
      const result = await importModels(ids, owner)
      await changeView(view)
      return result
    }} />
    {adding && <section className="rounded-[20px] bg-card p-5 shadow-card"><h2 className="mb-4 text-[22px] font-semibold">Add bike</h2><BikeForm initial={null} models={models} onSave={async (input, id) => {
      const bike = await saveBike(input, id, owner)
      if (view === 'active') setBikes(current => [...current.filter(item => item.id !== bike.id), bike])
      setAdding(false)
      return bike
    }} /></section>}
    <SegmentedControl aria-label="Garage view" className="[&_button]:min-h-11" value={view} onChange={next => void changeView(next)} options={[{ value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }]} />
    <div><label htmlFor="garage-unit" className="mr-3">Display mileage</label><select id="garage-unit" className="min-h-11 rounded-[10px] bg-input px-3" value={unit} onChange={event => setUnit(event.target.value as 'km' | 'mi')}><option value="km">Kilometres</option><option value="mi">Miles</option></select></div>
    {error && <div role="alert"><p>{error}</p><Button variant="outline" onClick={() => void changeView(view)}>Retry loading bikes</Button></div>}
    {loading ? <p role="status">Loading bikes…</p> : bikes.length ? <div className="grid grid-cols-1 gap-5 md:grid-cols-2">{bikes.map(bike => <GarageBikeCard key={bike.id} bike={bike} unit={unit} />)}</div> : !error && <p className="rounded-[20px] bg-card p-5 text-muted-foreground">{view === 'archived' ? 'No archived bikes.' : 'Your garage is empty. Add your first bike.'}</p>}
  </div>
}
