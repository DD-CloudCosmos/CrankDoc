'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Check, ChevronLeft, GitFork, Gauge, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GroupedList, ListRow } from '@/components/ui/grouped-list'
import { AppIcon } from '@/components/Logo'
import { BikeThumb } from '@/components/BikeThumb'
import { useGarage } from '@/hooks/useGarage'
import { SKILL_LEVELS, type GarageBikeOption } from '@/lib/garage'
import { cn } from '@/lib/utils'

type Step = 'welcome' | 'bikes' | 'skill' | 'done'

interface OnboardingProps {
  bikes: GarageBikeOption[]
  /** Guides that apply to every bike (shown in the final count) */
  universalTreeCount: number
}

const SAFETY_DOT: Record<string, string> = {
  green: 'bg-safe',
  yellow: 'bg-caution',
  red: 'bg-danger',
}
const SAFETY_TINT: Record<string, string> = {
  green: 'bg-safe-background',
  yellow: 'bg-caution-background',
  red: 'bg-danger-background',
}

/**
 * First-visit flow: welcome → pick bikes → experience → done.
 * Shown as a full-screen sheet on phones and a centred card on desktop,
 * only while the stored garage is not yet onboarded. Skippable at any time.
 */
export function Onboarding({ bikes, universalTreeCount }: OnboardingProps) {
  const { garage, toggleBike, setSkill, completeOnboarding } = useGarage()
  const [step, setStep] = useState<Step>('welcome')
  // Keeps the sheet open on the "done" step after onboarding is marked complete
  const [showingDone, setShowingDone] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  const open = garage !== null && (!garage.onboarded || showingDone)

  // Move focus into the dialog on open and on every step change
  useEffect(() => {
    if (open) dialogRef.current?.focus()
  }, [open, step])

  // Lock page scroll behind the sheet
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  if (!open || !garage) return null

  const selected = bikes.filter((bike) => garage.bikeIds.includes(bike.id))
  const guideCount = selected.reduce((sum, bike) => sum + bike.treeCount, 0) + universalTreeCount

  function finish() {
    completeOnboarding()
    setShowingDone(true)
    setStep('done')
  }

  function skip() {
    setShowingDone(false)
    completeOnboarding()
  }

  function close() {
    setShowingDone(false)
  }

  const diagnoseHref = selected.length === 1 ? `/diagnose?bike=${selected[0].id}` : '/diagnose'
  const doneLine =
    selected.length === 0
      ? `${guideCount} guides ready to go.`
      : `${selected.length === 1 ? `${selected[0].make} ${selected[0].model}` : `${selected.length} bikes`} added. ${guideCount} guides ready to go.`

  return (
    <div className="fixed inset-0 z-[60] flex items-stretch justify-center bg-black/40 md:items-center md:p-6">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === 'Escape') (step === 'done' ? close : skip)()
        }}
        className={cn(
          'flex w-full flex-col overflow-hidden outline-none md:h-[min(760px,90vh)] md:max-w-[440px] md:rounded-[28px] md:shadow-float',
          step === 'bikes' || step === 'skill' ? 'bg-background' : 'bg-card'
        )}
        style={{ animation: 'riseIn 0.35s ease-out both' }}
      >
        {step === 'welcome' && (
          <div className="flex flex-1 flex-col overflow-y-auto px-8 pb-6 pt-16">
            <AppIcon className="h-[84px] w-[84px] self-center rounded-[20px] shadow-[0_10px_30px_rgba(242,88,28,0.3)]" />
            <h2 id="onboarding-title" className="mt-7 text-center text-[34px] font-bold leading-tight tracking-[-0.025em]">
              Welcome to <br />
              CrankDoc
            </h2>
            <ul className="mt-10 space-y-6">
              <Feature icon={<GitFork />} title="Guided diagnosis" body="Answer one question at a time until you find the cause." />
              <Feature icon={<Gauge />} title="Specs for your bike" body="Torque values, fluids and intervals, right in the step." />
              <Feature icon={<ShieldCheck />} title="Safety first" body="Every step tells you when to take care, or call a pro." />
            </ul>
            <p className="mt-auto pt-8 text-center text-[13px] text-muted-foreground">
              Your garage is saved on this device. No account needed.
            </p>
            <Button className="mt-3 w-full rounded-[14px]" onClick={() => setStep('bikes')}>
              Continue
            </Button>
            <Button variant="ghost" className="mt-1 w-full" onClick={skip}>
              Not now
            </Button>
          </div>
        )}

        {step === 'bikes' && (
          <div className="flex min-h-0 flex-1 flex-col">
            <SheetHeader onBack={() => setStep('welcome')} backLabel="Back" onSkip={skip} />
            <h2 id="onboarding-title" className="px-5 text-[34px] font-bold tracking-[-0.025em]">
              Your Garage
            </h2>
            <p className="px-5 pt-1 text-[15px] text-muted-foreground">Choose the bikes you work on.</p>
            <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-4 pb-2">
              {bikes.length === 0 ? (
                <p className="px-4 py-6 text-[15px] text-muted-foreground">
                  Bikes couldn&apos;t be loaded right now. You can add them later from the home page.
                </p>
              ) : (
                <GroupedList footer={`${bikes.length} models available. You can change this later.`}>
                  {bikes.map((bike) => {
                    const isSelected = garage.bikeIds.includes(bike.id)
                    return (
                        <ListRow
                          key={bike.id}
                          buttonProps={{ role: 'checkbox', 'aria-checked': isSelected, 'aria-label': `${bike.make} ${bike.model}` }}
                          label={bike.model}
                          subtitle={bike.make}
                          onClick={() => toggleBike(bike.id)}
                          leading={
                            <BikeThumb
                              imageUrl={bike.imageUrl}
                              alt=""
                              className="h-10 w-[52px]"
                            />
                          }
                          trailing={
                            isSelected ? (
                              <Check aria-hidden="true" className="h-5 w-5 text-primary" strokeWidth={2.75} />
                            ) : (
                              <span className="h-5 w-5" />
                            )
                          }
                        />
                    )
                  })}
                </GroupedList>
              )}
            </div>
            <div className="px-4 pb-6 pt-3">
              <Button className="w-full rounded-[14px]" disabled={selected.length === 0 && bikes.length > 0} onClick={() => setStep('skill')}>
                {selected.length === 0 && bikes.length > 0 ? 'Choose a Bike' : 'Continue'}
              </Button>
            </div>
          </div>
        )}

        {step === 'skill' && (
          <div className="flex min-h-0 flex-1 flex-col">
            <SheetHeader onBack={() => setStep('bikes')} backLabel="Garage" onSkip={skip} />
            <h2 id="onboarding-title" className="px-5 text-[34px] font-bold tracking-[-0.025em]">
              Experience
            </h2>
            <p className="px-5 pt-1 text-[15px] text-muted-foreground">We&apos;ll flag steps beyond your comfort zone.</p>
            <div role="radiogroup" aria-labelledby="onboarding-title" className="mt-4 px-4">
              <GroupedList>
                {SKILL_LEVELS.map((level) => {
                  const isSelected = garage.skill === level.id
                  return (
                      <ListRow
                        key={level.id}
                        buttonProps={{ role: 'radio', 'aria-checked': isSelected }}
                        label={level.title}
                        subtitle={level.description}
                        onClick={() => setSkill(level.id)}
                        leading={
                          <span aria-hidden="true" className={cn('flex h-[30px] w-[30px] items-center justify-center rounded-[8px]', SAFETY_TINT[level.safety])}>
                            <span className={cn('h-2.5 w-2.5 rounded-full', SAFETY_DOT[level.safety])} />
                          </span>
                        }
                        trailing={
                          isSelected ? (
                            <Check aria-hidden="true" className="h-5 w-5 text-primary" strokeWidth={2.75} />
                          ) : (
                            <span className="h-5 w-5" />
                          )
                        }
                      />
                  )
                })}
              </GroupedList>
            </div>
            <div className="mt-auto px-4 pb-6 pt-3">
              <Button className="w-full rounded-[14px]" onClick={finish}>
                Done
              </Button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-1 flex-col px-8 pb-6 pt-24 text-center">
            <span aria-hidden="true" className="flex h-[76px] w-[76px] items-center justify-center self-center rounded-full bg-safe text-white">
              <Check className="h-10 w-10" strokeWidth={2.75} />
            </span>
            <h2 id="onboarding-title" className="mt-6 text-[28px] font-bold tracking-[-0.02em]">
              You&apos;re all set
            </h2>
            <p className="mt-2 text-[17px] text-muted-foreground">{doneLine}</p>
            <Button asChild className="mt-auto w-full rounded-[14px]">
              <Link href={diagnoseHref} onClick={close}>
                Start Diagnosing
              </Link>
            </Button>
            <Button variant="ghost" className="mt-1 w-full" onClick={close}>
              Explore CrankDoc
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <li className="flex items-start gap-4">
      <span aria-hidden="true" className="text-primary [&_svg]:h-8 [&_svg]:w-8 [&_svg]:stroke-[1.75]">
        {icon}
      </span>
      <span>
        <span className="block text-[17px] font-semibold">{title}</span>
        <span className="mt-0.5 block text-[15px] leading-snug text-muted-foreground">{body}</span>
      </span>
    </li>
  )
}

function SheetHeader({ onBack, backLabel, onSkip }: { onBack: () => void; backLabel: string; onSkip: () => void }) {
  return (
    <div className="flex items-center justify-between px-2 pt-2">
      <button type="button" onClick={onBack} className="flex h-11 items-center gap-0.5 px-2 text-[17px] text-primary">
        <ChevronLeft aria-hidden="true" className="h-6 w-6" strokeWidth={2.25} />
        {backLabel}
      </button>
      <button type="button" onClick={onSkip} className="h-11 px-3 text-[17px] text-primary">
        Skip
      </button>
    </div>
  )
}
