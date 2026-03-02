import { SmartSearch } from '@/components/SmartSearch'
import { SafeDisclaimer } from '@/components/SafeDisclaimer'

export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Smart Search</h1>
        <p className="text-muted-foreground">
          Ask anything about motorcycle maintenance, specs, or diagnostics
        </p>
      </div>
      <SmartSearch />
      <div className="mt-8">
        <SafeDisclaimer variant="compact" />
      </div>
    </div>
  )
}
