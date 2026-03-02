import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Smart Search',
  description: 'Ask AI-powered questions about motorcycle maintenance, specs, and diagnostics using our reference library.',
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children
}
