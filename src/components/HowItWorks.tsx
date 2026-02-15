import { Database, Search, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

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
    <section>
      <h2 className="mb-8 text-center text-2xl font-bold sm:text-3xl">
        How It Works
      </h2>
      <div className="grid gap-6 sm:grid-cols-3">
        {steps.map((step) => {
          const Icon = step.icon
          return (
            <Card key={step.number} className="relative">
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1F1F1F] text-sm font-bold text-white">
                  {step.number}
                </div>
                <Icon className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
