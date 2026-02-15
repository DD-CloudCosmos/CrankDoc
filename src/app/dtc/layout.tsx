import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DTC Code Lookup',
  description: 'Look up motorcycle diagnostic trouble codes (DTC). Find meanings, causes, and solutions for OBD and manufacturer-specific fault codes.',
}

export default function DtcLayout({ children }: { children: React.ReactNode }) {
  return children
}
