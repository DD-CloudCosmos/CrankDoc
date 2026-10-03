import { Bike } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BikeThumbProps {
  imageUrl: string | null
  alt: string
  className?: string
}

/**
 * Rounded bike photo with a neutral placeholder when there is no image.
 * Size it with className (e.g. "h-10 w-[52px]").
 */
export function BikeThumb({ imageUrl, alt, className }: BikeThumbProps) {
  if (!imageUrl) {
    return (
      <span
        role="img"
        aria-label={alt}
        className={cn('flex items-center justify-center overflow-hidden rounded-[8px] bg-secondary text-muted-foreground', className)}
      >
        <Bike className="h-1/2 w-1/2" strokeWidth={1.5} aria-hidden="true" />
      </span>
    )
  }

  return (
    // Remote Supabase images; next/image would need remotePatterns config per project
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imageUrl} alt={alt} className={cn('overflow-hidden rounded-[8px] object-cover', className)} />
  )
}
