import { RecallList } from '@/components/RecallList'

export default function RecallsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Recall Lookup</h1>
        <p className="text-muted-foreground">
          Search NHTSA safety recalls by make, model, or year
        </p>
      </div>

      <RecallList />
    </div>
  )
}
