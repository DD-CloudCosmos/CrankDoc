import { NextResponse } from 'next/server'
import type { VinDecodedResult } from '@/types/database.types'

const NHTSA_API_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues'

function valueOrNull(val: unknown): string | null {
  if (typeof val === 'string' && val.trim() !== '') return val.trim()
  return null
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const vin = searchParams.get('vin')

  if (!vin) {
    return NextResponse.json({ error: 'VIN parameter is required' }, { status: 400 })
  }

  if (vin.length !== 17) {
    return NextResponse.json({ error: 'VIN must be exactly 17 characters' }, { status: 400 })
  }

  try {
    const response = await fetch(`${NHTSA_API_URL}/${vin}?format=json`)

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to decode VIN' }, { status: 502 })
    }

    const data = await response.json()
    const result = data.Results?.[0] as Record<string, string> | undefined

    if (!result) {
      return NextResponse.json({ error: 'No results from NHTSA' }, { status: 502 })
    }

    const yearStr = valueOrNull(result.ModelYear)

    const decoded: VinDecodedResult = {
      make: valueOrNull(result.Make),
      model: valueOrNull(result.Model),
      year: yearStr ? parseInt(yearStr, 10) : null,
      vehicleType: valueOrNull(result.VehicleType),
      engineSize: valueOrNull(result.DisplacementL),
      fuelType: valueOrNull(result.FuelTypePrimary),
      displacement: valueOrNull(result.DisplacementL),
      cylinders: valueOrNull(result.EngineCylinders),
      transmissionType: valueOrNull(result.TransmissionStyle),
      errorCode: valueOrNull(result.ErrorCode),
      errorText: valueOrNull(result.ErrorText),
    }

    return NextResponse.json(decoded)
  } catch {
    return NextResponse.json({ error: 'Failed to connect to NHTSA API' }, { status: 502 })
  }
}
