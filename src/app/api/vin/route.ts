import { NextResponse } from 'next/server'
import type { VinDecodedResult } from '@/types/database.types'

const NHTSA_API_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues'

function extractValue(results: Array<{ Variable: string; Value: string | null }>, variableName: string): string | null {
  const entry = results.find((r) => r.Variable === variableName)
  return entry?.Value || null
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
    const results = data.Results as Array<{ Variable: string; Value: string | null }>

    const yearStr = extractValue(results, 'Model Year')

    const decoded: VinDecodedResult = {
      make: extractValue(results, 'Make'),
      model: extractValue(results, 'Model'),
      year: yearStr ? parseInt(yearStr, 10) : null,
      vehicleType: extractValue(results, 'Vehicle Type'),
      engineSize: extractValue(results, 'Displacement (L)'),
      fuelType: extractValue(results, 'Fuel Type - Primary'),
      displacement: extractValue(results, 'Displacement (L)'),
      cylinders: extractValue(results, 'Engine Number of Cylinders'),
      transmissionType: extractValue(results, 'Transmission Style'),
      errorCode: extractValue(results, 'Error Code'),
      errorText: extractValue(results, 'Error Text'),
    }

    return NextResponse.json(decoded)
  } catch {
    return NextResponse.json({ error: 'Failed to connect to NHTSA API' }, { status: 502 })
  }
}
