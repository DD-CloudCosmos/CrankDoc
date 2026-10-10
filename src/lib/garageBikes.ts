export type BikeInput = {
  motorcycleId: string | null; nickname: string; make: string; model: string;
  year: number | null; variant: string; market: string; registration: string;
  mileageKm: number | null;
}
export type BikeView = BikeInput & {
  id: string; archivedAt: string | null; photoPath: string | null;
  libraryImageUrl: string | null; modelReferenceUrl: string | null;
}

export function requireBikeId(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new Error('Invalid bike ID')
  return value
}

export function parseBikeInput(input: unknown): BikeInput {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid bike')
  const value = input as Record<string, unknown>
  const text = (field: string, limit: number, required = false): string => {
    const item = value[field]
    if (typeof item !== 'string' || item.length > limit || (required && !item.trim())) throw new Error(`Invalid ${field}`)
    return item.trim()
  }
  const motorcycleId = value.motorcycleId === null ? null : requireBikeId(value.motorcycleId)
  const year = value.year
  if (year !== null && (typeof year !== 'number' || !Number.isInteger(year) || year < 1885 || year > 2100)) throw new Error('Invalid year')
  const mileageKm = value.mileageKm
  if (mileageKm !== null && (typeof mileageKm !== 'number' || !Number.isFinite(mileageKm) || mileageKm < 0 || mileageKm > 999999999.999)) throw new Error('Invalid mileage')
  return { motorcycleId, nickname: text('nickname', 80), make: text('make', 120, true), model: text('model', 120, true),
    year: year as number | null, variant: text('variant', 120), market: text('market', 120), registration: text('registration', 40),
    mileageKm: mileageKm === null ? null : Math.round((mileageKm as number) * 1000) / 1000 }
}

export function validateCatalogueScope(input: BikeInput, model: { make: string; model: string; year_start: number; year_end: number | null }): void {
  if (input.make !== model.make || input.model !== model.model) throw new Error('Bike does not match catalogue model')
  if (input.year !== null && (input.year < model.year_start || (model.year_end !== null && input.year > model.year_end))) throw new Error('Year outside catalogue model range')
}
