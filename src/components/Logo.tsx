import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <h1 className={cn('text-2xl font-bold text-zinc-900 dark:text-zinc-50', className)}>
      CrankDoc
    </h1>
  )
}
