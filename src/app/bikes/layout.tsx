import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Motorcycle Database',
  description: 'Browse motorcycle specs, service information, and diagnostic guides for Honda, Yamaha, Kawasaki, Harley-Davidson, and BMW models.',
}

export default function BikesLayout({ children }: { children: React.ReactNode }) {
  return children
}
