export const DIFFICULTY_STYLES: Record<string, { label: string; badgeClass: string }> = {
  beginner: { label: 'Beginner', badgeClass: 'border-green-500/40 text-green-700' },
  intermediate: { label: 'Intermediate', badgeClass: 'border-amber-500/40 text-amber-700' },
  advanced: { label: 'Advanced', badgeClass: 'border-red-500/40 text-red-700' },
}

export const SEVERITY_STYLES: Record<string, { label: string; dotClass: string; badgeClass: string }> = {
  low: { label: 'Low', dotClass: 'bg-green-500', badgeClass: 'border-green-500/40 text-green-700' },
  medium: { label: 'Medium', dotClass: 'bg-amber-500', badgeClass: 'border-amber-500/40 text-amber-700' },
  high: { label: 'High', dotClass: 'bg-orange-500', badgeClass: 'border-orange-500/40 text-orange-700' },
  critical: { label: 'Critical', dotClass: 'bg-red-500', badgeClass: 'border-red-500/40 text-red-700' },
}
