'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { GroupedList, ListRow } from '@/components/ui/grouped-list'
import type { VinDecodedResult } from '@/types/database.types'
import { Scan, Loader2 } from 'lucide-react'

export function VinDecoder() {
  const [vin, setVin] = useState('')
  const [result, setResult] = useState<VinDecodedResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleDecode = async () => {
    setError(null)
    setResult(null)

    if (vin.length !== 17) {
      setError('VIN must be exactly 17 characters')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/vin?vin=${encodeURIComponent(vin)}`)
      if (!response.ok) {
        setError('Failed to decode VIN. Please try again.')
        return
      }
      const data: VinDecodedResult = await response.json()
      setResult(data)
    } catch {
      setError('Failed to decode VIN. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const displayFields = result
    ? [
        { label: 'Make', value: result.make },
        { label: 'Model', value: result.model },
        { label: 'Year', value: result.year?.toString() },
        { label: 'Vehicle Type', value: result.vehicleType },
        { label: 'Cylinders', value: result.cylinders },
        { label: 'Displacement', value: result.displacement ? `${result.displacement}L` : null },
        { label: 'Fuel Type', value: result.fuelType },
        { label: 'Transmission', value: result.transmissionType },
      ].filter((f) => f.value)
    : []

  return (
    <div className="max-w-[640px] space-y-6">
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault()
          handleDecode()
        }}
      >
        <div className="relative flex-1">
          <Scan aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            aria-label="Vehicle Identification Number"
            autoComplete="off"
            spellCheck={false}
            placeholder="Enter 17-character VIN"
            value={vin}
            onChange={(e) => setVin(e.target.value.toUpperCase())}
            maxLength={17}
            className="h-12 rounded-[12px] pl-9 font-mono uppercase tracking-wider placeholder:font-sans placeholder:normal-case placeholder:tracking-normal"
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          Decode
        </Button>
      </form>
      <p className="text-[13px] text-muted-foreground">
        {vin.length}/17 characters · Usually stamped on the steering head and printed on the frame label.
      </p>

      {error && (
        <div role="alert" className="rounded-[14px] bg-danger-background p-4">
          <p className="text-[15px] text-danger-foreground">{error}</p>
        </div>
      )}

      {result && displayFields.length > 0 && (
        <GroupedList header="Decoded VIN Results">
          {displayFields.map(({ label, value }) => (
            <ListRow key={label} label={label} detail={<span className="text-foreground">{value}</span>} />
          ))}
        </GroupedList>
      )}
    </div>
  )
}
