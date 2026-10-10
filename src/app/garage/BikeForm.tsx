'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { parseBikeInput, type BikeInput, type BikeView } from '@/lib/garageBikes'

export type CatalogueOption = { id: string; make: string; model: string; year_start: number; year_end: number | null }
const blank: BikeInput = { motorcycleId: null, nickname: '', make: '', model: '', year: null, variant: '', market: '', registration: '', mileageKm: null }
export function BikeForm({ initial, onSave, models = [] }: { initial: BikeInput | null; onSave: (input: BikeInput, id: string) => Promise<BikeView>; models?: CatalogueOption[] }) {
  const [id] = useState(() => crypto.randomUUID())
  const [input, setInput] = useState(initial ?? blank)
  const [year, setYear] = useState(initial?.year?.toString() ?? '')
  const [mileage, setMileage] = useState(initial?.mileageKm?.toString() ?? '')
  const [unit, setUnit] = useState('km')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true); setError(''); setSaved(false)
    try {
      const parsed = parseBikeInput({ ...input, year: year === '' ? null : Number(year), mileageKm: mileage === '' ? null : Number(mileage) * (unit === 'mi' ? 1.609344 : 1) })
      await onSave(parsed, id)
      setSaved(true)
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not save. Try again.') }
    finally { setBusy(false) }
  }
  return <form onSubmit={submit} className="space-y-4" aria-describedby={error ? 'bike-error' : undefined}><fieldset disabled={busy} className="space-y-4">
    {!initial && <div className="space-y-2"><label htmlFor="catalogue">Model from the library</label><select id="catalogue" className="min-h-11 w-full rounded-[10px] bg-input px-3" value={input.motorcycleId ?? ''} onChange={event => {
      const model = models.find(model => model.id === event.target.value)
      setInput({ ...input, motorcycleId: model?.id ?? null, make: model?.make ?? '', model: model?.model ?? '' })
      setYear('')
    }}><option value="">Unlisted model (enter details)</option>{models.map(model => <option key={model.id} value={model.id}>{model.make} {model.model} ({model.year_start}–{model.year_end ?? 'present'})</option>)}</select></div>}
    {(['nickname', 'make', 'model'] as const).map(field => <div key={field} className="space-y-2">
      <label htmlFor={`bike-${field}`}>{field[0].toUpperCase() + field.slice(1)}</label>
      <Input id={`bike-${field}`} className="min-h-11" maxLength={field === 'nickname' ? 80 : 120} required={field === 'make' || field === 'model'} readOnly={Boolean(input.motorcycleId) && (field === 'make' || field === 'model')} value={input[field]} onChange={event => setInput({ ...input, [field]: event.target.value })} />
    </div>)}
    <div className="space-y-2"><label htmlFor="bike-year">Year</label><Input id="bike-year" className="min-h-11" type="number" min={1885} max={2100} step={1} value={year} onChange={event => setYear(event.target.value)} /><p className="text-[13px] text-muted-foreground">Leave blank if unknown.</p></div>
    <div className="space-y-2"><label htmlFor="bike-mileage">Mileage</label><Input id="bike-mileage" className="min-h-11" type="number" min={0} step="any" value={mileage} onChange={event => setMileage(event.target.value)} />
      <label htmlFor="mileage-unit">Mileage unit</label><select id="mileage-unit" className="min-h-11 rounded-[10px] bg-input px-3" value={unit} onChange={event => {
        const next = event.target.value
        if (mileage !== '') setMileage(String(Math.round(Number(mileage) * (next === 'mi' ? 1 / 1.609344 : 1.609344) * 1000) / 1000))
        setUnit(next)
      }}><option value="km">Kilometres</option><option value="mi">Miles</option></select><p className="text-[13px] text-muted-foreground">Leave blank if unknown. Details edits can correct the recorded mileage.</p>
    </div>
    <details className="rounded-[14px] bg-input p-4"><summary className="flex min-h-11 cursor-pointer items-center">Variant, market and registration</summary><div className="mt-3 space-y-4">{(['variant', 'market', 'registration'] as const).map(field => <div key={field} className="space-y-2"><label htmlFor={`bike-${field}`}>{field[0].toUpperCase() + field.slice(1)}</label><Input id={`bike-${field}`} className="min-h-11" maxLength={field === 'registration' ? 40 : 120} value={input[field]} onChange={event => setInput({ ...input, [field]: event.target.value })} /></div>)}</div></details>
    {error && <p id="bike-error" role="alert">{error} <Link href="/account?next=/garage" target="_blank" className="text-link">Sign in in another tab</Link></p>}
    {saved && <p role="status">Bike saved.</p>}
    <Button disabled={busy} type="submit">{busy ? 'Saving…' : 'Save bike'}</Button>
  </fieldset></form>
}
