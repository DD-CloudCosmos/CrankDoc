'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className="space-y-6">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Scan className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Enter 17-character VIN"
            value={vin}
            onChange={(e) => setVin(e.target.value.toUpperCase())}
            maxLength={17}
            className="pl-10 font-mono uppercase"
          />
        </div>
        <Button onClick={handleDecode} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Decode
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-4 text-center">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {result && displayFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Decoded VIN Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {displayFields.map(({ label, value }) => (
              <div key={label} className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
