import { HowItWorks } from '@/components/HowItWorks'

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      {/* Hero Card */}
      <div
        className="mx-auto max-w-2xl rounded-[24px] bg-card p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.12)] sm:p-12"
        style={{ animation: 'riseIn 0.6s ease-out both' }}
      >
        <h1 className="mb-4 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
          CrankDoc
        </h1>
        <p className="text-lg text-muted-foreground sm:text-xl">
          Your motorcycle mechanic&apos;s digital companion
        </p>
      </div>

      {/* How It Works + CTA */}
      <div className="mt-12 sm:mt-16">
        <HowItWorks />
      </div>
    </div>
  )
}
