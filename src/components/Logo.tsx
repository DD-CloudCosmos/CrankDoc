import { cn } from '@/lib/utils'

interface AppIconProps {
  className?: string
}

/**
 * The CrankDoc app icon: an orange rounded square with a white trace line.
 * Decorative — always pair it with the visible "CrankDoc" wordmark.
 */
export function AppIcon({ className }: AppIconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[6px] bg-gradient-to-b from-[#FF8A3D] to-[#F2581C]',
        className
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="h-[60%] w-[60%]">
        <path d="M3 12h4l3-8 4 16 3-8h4" />
      </svg>
    </span>
  )
}

interface LogoProps {
  className?: string
}

/** App icon plus wordmark, used in the navigation bar. */
export function Logo({ className }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-[17px] font-semibold text-foreground', className)}>
      <AppIcon />
      CrankDoc
    </span>
  )
}
