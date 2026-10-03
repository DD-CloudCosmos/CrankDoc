import { cn } from '@/lib/utils'

/** Standard page width and padding for app pages (not the landing page). */
export function PageContainer({
  children,
  className,
  narrow = false,
}: {
  children: React.ReactNode
  className?: string
  /** Reading width for step-by-step flows */
  narrow?: boolean
}) {
  return (
    <div className={cn('mx-auto w-full px-4 py-6 md:px-[22px] md:py-10', narrow ? 'max-w-[720px]' : 'max-w-[1024px]', className)}>
      {children}
    </div>
  )
}

interface PageHeaderProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  /** Small line above the title, e.g. the bike name */
  eyebrow?: React.ReactNode
  /** Right-aligned actions (buttons, segmented control) */
  actions?: React.ReactNode
  className?: string
}

/** iOS-style large title header used at the top of every app page. */
export function PageHeader({ title, subtitle, eyebrow, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-[15px] text-muted-foreground">{eyebrow}</p>}
        <h1 className="text-[34px] font-bold leading-tight tracking-[-0.025em] md:text-[40px]">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-[640px] text-[17px] text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}
