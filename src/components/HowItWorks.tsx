import Link from 'next/link'
import { Database, Search, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const steps = [
  {
    number: 1,
    icon: Database,
    title: 'Select Your Motorcycle',
    description: 'Choose from Honda, Yamaha, Kawasaki, Harley-Davidson, or BMW models.',
  },
  {
    number: 2,
    icon: Search,
    title: 'Choose Your Symptom',
    description: 'Pick the issue you are experiencing from model-specific diagnostic trees.',
  },
  {
    number: 3,
    icon: CheckCircle,
    title: 'Follow the Steps',
    description: 'Walk through guided questions and checks to diagnose and fix the problem.',
  },
] as const

export function HowItWorks() {
  return (
    <section
      className="bg-secondary rounded-[24px] p-8 sm:p-12"
      style={{
        animation: 'riseIn 0.6s ease-out both',
        animationDelay: '200ms',
      }}
    >
      <h2 className="mb-8 text-center text-2xl font-bold sm:text-3xl">
        How It Works
      </h2>
      <div className="grid gap-6 sm:grid-cols-3">
        {steps.map((step) => {
          const Icon = step.icon
          return (
            <div key={step.number} className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1F1F1F] text-sm font-bold text-white">
                {step.number}
              </div>
              <Icon className="h-8 w-8 text-primary" />
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          )
        })}
      </div>

      {/* CTA Section */}
      <div className="mt-10 border-t border-border/50 pt-10 text-center">
        <Button asChild size="lg" className="h-14 w-full rounded-[999px] px-10 text-lg sm:w-auto">
          <Link href="/diagnose">Start Diagnosing &rarr;</Link>
        </Button>
        <p className="mt-3 text-sm text-muted-foreground">
          No account needed. Free forever.
        </p>
      </div>
    </section>
  )
}
