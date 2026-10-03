import * as React from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * iOS-style inset grouped list: an optional small header, a rounded white
 * group of rows separated by hairlines, and an optional footer note.
 *
 * <GroupedList header="Expected readings">
 *   <ListRow label="Healthy" detail="12.6 V or more" />
 *   <ListRow label="Below 12.0 V" href="/diagnose/x" chevron />
 * </GroupedList>
 */
interface GroupedListProps {
  header?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function GroupedList({ header, footer, children, className }: GroupedListProps) {
  return (
    <section className={cn("w-full", className)}>
      {header && (
        <h3 className="mb-1.5 px-4 text-[13px] font-normal uppercase tracking-normal text-muted-foreground">
          {header}
        </h3>
      )}
      <div className="overflow-hidden rounded-[12px] bg-card shadow-card">{children}</div>
      {footer && <p className="mt-1.5 px-4 text-[13px] text-muted-foreground">{footer}</p>}
    </section>
  )
}

interface ListRowProps {
  /** Main text of the row */
  label: React.ReactNode
  /** Smaller second line under the label */
  subtitle?: React.ReactNode
  /** Right-aligned value, e.g. "43 Nm" */
  detail?: React.ReactNode
  /** Element shown before the label: an icon tile or thumbnail */
  leading?: React.ReactNode
  /** Element shown at the far right instead of a chevron, e.g. a checkmark */
  trailing?: React.ReactNode
  /** Show a disclosure chevron (defaults to true when the row is a link) */
  chevron?: boolean
  href?: string
  onClick?: () => void
  /** Extra attributes for the row button, e.g. role="radio" and aria-checked */
  buttonProps?: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "className" | "type">
  className?: string
}

export function ListRow({
  label,
  subtitle,
  detail,
  leading,
  trailing,
  chevron,
  href,
  onClick,
  buttonProps,
  className,
}: ListRowProps) {
  const showChevron = chevron ?? Boolean(href)
  const interactive = Boolean(href || onClick)

  const content = (
    <>
      {leading && <span className="flex shrink-0 items-center">{leading}</span>}
      <span className="flex min-h-[44px] flex-1 items-center gap-3 border-b border-separator py-2.5 pr-4 group-last/row:border-b-0">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[17px] leading-snug text-foreground">{label}</span>
          {subtitle && <span className="text-[13px] leading-snug text-muted-foreground">{subtitle}</span>}
        </span>
        {detail && <span className="shrink-0 text-[17px] text-muted-foreground">{detail}</span>}
        {trailing}
        {showChevron && !trailing && (
          <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-chevron" strokeWidth={2.5} />
        )}
      </span>
    </>
  )

  const rowClassName = cn(
    "group/row flex w-full items-center gap-3 pl-4 text-left",
    interactive && "transition-colors hover:bg-accent/60 active:bg-accent focus-visible:bg-accent focus-visible:outline-none",
    className
  )

  if (href) {
    return (
      <Link href={href} className={rowClassName}>
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button type="button" {...buttonProps} onClick={onClick} className={rowClassName}>
        {content}
      </button>
    )
  }

  return <div className={rowClassName}>{content}</div>
}

/** Small rounded-square icon tile used as a ListRow `leading` element. */
interface IconTileProps {
  children: React.ReactNode
  /** Tailwind background class, e.g. "bg-primary" */
  className?: string
}

export function IconTile({ children, className }: IconTileProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-[30px] w-[30px] items-center justify-center rounded-[8px] bg-primary text-white [&_svg]:h-[17px] [&_svg]:w-[17px]",
        className
      )}
    >
      {children}
    </span>
  )
}
