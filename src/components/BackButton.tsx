import Link from "next/link"
import { ChevronLeft } from "lucide-react"

interface BackButtonProps {
  href: string
  label: string
  /** Screen-reader name when the visible label is short, e.g. "Back to symptoms" */
  ariaLabel?: string
}

/** iOS-style back link: blue chevron + label, 44px tall touch target. */
export function BackButton({ href, label, ariaLabel }: BackButtonProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="-ml-1.5 mb-2 inline-flex min-h-[44px] items-center gap-0.5 text-[17px] text-primary hover:opacity-80"
    >
      <ChevronLeft aria-hidden="true" className="h-4 w-4 scale-150" strokeWidth={2.25} />
      {label}
    </Link>
  )
}
