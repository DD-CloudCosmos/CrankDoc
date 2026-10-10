'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { BikeView } from '@/lib/garageBikes'
export function ImportGarage({ selectedModelIds, onImport }: { selectedModelIds: string[]; onImport: (ids: string[]) => Promise<{ bikes: BikeView[]; failed: string[] }> }) {
  const [dismissed, setDismissed] = useState(false)
  const [failed, setFailed] = useState<string[]>([])
  const [count, setCount] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (dismissed || !selectedModelIds.length) return null
  async function perform() {
    setBusy(true); setError('')
    try {
      const result = await onImport(failed.length ? failed : selectedModelIds)
      setFailed(result.failed); setCount((count ?? 0) + result.bikes.length)
    } catch (error) { setError(error instanceof Error ? error.message : 'Import failed. Try again.') }
    finally { setBusy(false) }
  }
  return <section className="space-y-3 rounded-[20px] bg-card p-5 shadow-card" aria-label="Import browser selections">
    <h2 className="text-[19px] font-semibold">Bring your browser selections into My Garage</h2>
    <p className="text-[15px] text-muted-foreground">Import one bike per selected model. Year and mileage stay unknown. Your diagnostic shortcuts and experience preference stay available.</p>
    {count !== null && <p role="status">{count} {count === 1 ? 'bike imported' : 'bikes imported'}.</p>}
    {failed.length > 0 && <p role="alert">Could not import these model IDs: {failed.join(', ')}. A model may be unavailable. Retry or add an unlisted bike.</p>}
    {error && <p role="alert">{error}</p>}
    <div className="flex flex-wrap gap-3">{(count === null || failed.length > 0) && <Button disabled={busy} onClick={() => void perform()}>{busy ? 'Importing…' : failed.length ? 'Retry failed imports' : 'Import browser selections'}</Button>}<Button variant="outline" disabled={busy} onClick={() => setDismissed(true)}>{count === null ? 'Not now' : 'Dismiss'}</Button></div>
  </section>
}
