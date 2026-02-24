import { GlossaryList } from '@/components/GlossaryList'

export default function GlossaryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Glossary</h1>
        <p className="text-muted-foreground">
          Look up motorcycle and scooter terms
        </p>
      </div>
      <GlossaryList />
    </div>
  )
}
