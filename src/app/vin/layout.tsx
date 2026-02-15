import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'VIN Decoder',
  description: 'Decode any motorcycle VIN to identify make, model, year, engine type, and manufacturing details using the NHTSA database.',
}

export default function VinLayout({ children }: { children: React.ReactNode }) {
  return children
}
