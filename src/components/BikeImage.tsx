import { cn } from '@/lib/utils'
import type { MotorcycleImage } from '@/types/database.types'

interface BikeImageProps {
  image?: MotorcycleImage | null
  make: string
  model: string
  className?: string
}

export function BikeImage({ image, make, model, className }: BikeImageProps) {
  if (image) {
    return (
      <div className={cn('overflow-hidden rounded-[24px]', className)}>
        <div className="relative aspect-[3/2] w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.image_url}
            alt={image.alt_text}
            className="h-full w-full object-cover"
            style={{ filter: 'sepia(15%) saturate(85%) brightness(102%)' }}
          />
        </div>
        {image.source_attribution && (
          <p className="mt-1 text-center text-xs text-muted-foreground">
            {image.source_attribution}
          </p>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-[24px] bg-gradient-to-b from-[#EADFCB] to-[#D8CBB4]',
        className
      )}
    >
      <div className="flex aspect-[3/2] w-full flex-col items-center justify-center gap-3 p-6">
        <svg
          viewBox="0 0 120 80"
          className="h-16 w-24 text-[#8B7D6B]"
          fill="currentColor"
          aria-hidden="true"
        >
          {/* Minimal motorcycle silhouette */}
          <circle cx="25" cy="60" r="15" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="95" cy="60" r="15" fill="none" stroke="currentColor" strokeWidth="3" />
          <path
            d="M25 60 L40 35 L65 28 L80 32 L95 60"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M65 28 L55 22 L68 20 L75 25"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M40 35 L38 55"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          <path
            d="M80 32 L88 52"
            stroke="currentColor"
            strokeWidth="2.5"
          />
        </svg>
        <span className="text-sm font-medium text-[#6B5E4F]">
          {make} {model}
        </span>
      </div>
    </div>
  )
}
