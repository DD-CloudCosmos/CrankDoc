import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Diagnostic Trees',
  description: 'Interactive motorcycle diagnostic troubleshooting trees. Step-by-step guides for engine, electrical, fuel, brake, and suspension issues.',
}

export default function DiagnoseLayout({ children }: { children: React.ReactNode }) {
  return children
}
