// Badge colours use the safety tokens from globals.css so they stay readable
// in both light and dark mode. Use with <Badge variant="outline" className={...}>.
export const DIFFICULTY_STYLES: Record<string, { label: string; badgeClass: string }> = {
  beginner: { label: 'Beginner', badgeClass: 'border-transparent bg-safe-background text-safe-foreground' },
  intermediate: { label: 'Intermediate', badgeClass: 'border-transparent bg-caution-background text-caution-foreground' },
  advanced: { label: 'Advanced', badgeClass: 'border-transparent bg-danger-background text-danger-foreground' },
}

export const SEVERITY_STYLES: Record<string, { label: string; dotClass: string; badgeClass: string }> = {
  low: { label: 'Low', dotClass: 'bg-safe', badgeClass: 'border-transparent bg-safe-background text-safe-foreground' },
  medium: { label: 'Medium', dotClass: 'bg-caution', badgeClass: 'border-transparent bg-caution-background text-caution-foreground' },
  high: { label: 'High', dotClass: 'bg-danger', badgeClass: 'border-transparent bg-danger-background text-danger-foreground' },
  critical: { label: 'Critical', dotClass: 'bg-danger', badgeClass: 'border-transparent bg-danger text-white' },
}
