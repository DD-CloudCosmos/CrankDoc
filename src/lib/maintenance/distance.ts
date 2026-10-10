export function toKilometres(value: number, unit: 'km' | 'miles'): number {
  if (!Number.isFinite(value) || value < 0 || !['km', 'miles'].includes(unit)) throw new Error('Invalid mileage')
  const km = Math.round(value * (unit === 'miles' ? 1.609344 : 1) * 1000) / 1000
  if (km >= 1_000_000_000) throw new Error('Mileage is too large')
  return km
}
