import Link from 'next/link'
import { Search, Database, FileText, Scan } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HowItWorks } from '@/components/HowItWorks'
import { FeatureHighlight } from '@/components/FeatureHighlight'
import { SafeDisclaimer } from '@/components/SafeDisclaimer'

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          CrankDoc
        </h1>
        <p className="mb-2 text-lg text-muted-foreground sm:text-xl">
          Your motorcycle mechanic&apos;s digital companion
        </p>
        <p className="mx-auto mb-8 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Step-by-step diagnostic troubleshooting for Honda, Yamaha, Kawasaki,
          Harley-Davidson, and BMW motorcycles
        </p>
        <Button asChild size="lg">
          <Link href="/diagnose">Start Diagnosing &rarr;</Link>
        </Button>
      </div>

      {/* Stats Banner */}
      <div className="mb-12 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground sm:gap-8 sm:text-base">
        <span className="font-semibold text-foreground">57</span>{' '}
        Diagnostic Trees
        <span className="hidden text-border sm:inline" aria-hidden="true">|</span>
        <span className="font-semibold text-foreground">6</span>{' '}
        Motorcycle Models
        <span className="hidden text-border sm:inline" aria-hidden="true">|</span>
        <span className="font-semibold text-foreground">500+</span>{' '}
        DTC Codes
      </div>

      {/* How It Works */}
      <div className="mb-12">
        <HowItWorks />
      </div>

      {/* Feature Highlights */}
      <div className="mb-12">
        <h2 className="mb-8 text-center text-2xl font-bold sm:text-3xl">
          Features
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FeatureHighlight
            icon={<Search className="h-10 w-10 text-primary" />}
            title="Diagnose"
            description="Walk through interactive decision trees to troubleshoot engine, electrical, fuel, brake, and suspension issues step by step."
            href="/diagnose"
          />
          <FeatureHighlight
            icon={<Database className="h-10 w-10 text-primary" />}
            title="Bikes"
            description="Browse detailed specs and model-specific diagnostic trees for Honda, Yamaha, Kawasaki, Harley-Davidson, and BMW motorcycles."
            href="/bikes"
          />
          <FeatureHighlight
            icon={<Scan className="h-10 w-10 text-primary" />}
            title="VIN Decoder"
            description="Decode any motorcycle VIN to instantly look up make, model, year, engine, and transmission details."
            href="/vin"
          />
          <FeatureHighlight
            icon={<FileText className="h-10 w-10 text-primary" />}
            title="DTC Codes"
            description="Search and look up diagnostic trouble codes to understand what your motorcycle is telling you."
            href="/dtc"
          />
        </div>
      </div>

      {/* Safety Disclaimer */}
      <SafeDisclaimer variant="full" />
    </div>
  )
}
