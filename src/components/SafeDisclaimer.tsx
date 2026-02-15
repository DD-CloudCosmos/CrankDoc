import { AlertTriangle } from 'lucide-react'

interface SafeDisclaimerProps {
  variant?: 'compact' | 'full'
}

const DISCLAIMER_TEXT =
  'CrankDoc provides diagnostic guidance for educational reference only. Always follow manufacturer service manual procedures. Consult a qualified mechanic for safety-critical repairs.'

export function SafeDisclaimer({ variant = 'compact' }: SafeDisclaimerProps) {
  if (variant === 'compact') {
    return (
      <p className="text-xs text-muted-foreground">{DISCLAIMER_TEXT}</p>
    )
  }

  return (
    <section className="rounded-lg border border-border p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
        <div>
          <h3 className="mb-1 font-semibold">Safety Disclaimer</h3>
          <p className="text-sm text-muted-foreground">{DISCLAIMER_TEXT}</p>
        </div>
      </div>
    </section>
  )
}
