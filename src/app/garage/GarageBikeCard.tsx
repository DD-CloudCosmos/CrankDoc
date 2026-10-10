import Link from 'next/link'
import { PrivateBikePhoto } from './[bikeId]/BikePhotoEditor'
import { formatBikeMileage, type BikeView } from '@/lib/garageBikes'

export function GarageBikeCard({ bike, unit = 'km' }: { bike: BikeView; unit?: 'km' | 'mi' }) {
  const name = bike.nickname || `${bike.make} ${bike.model}`
  return <Link href={`/garage/${bike.id}`} prefetch={false} className="block overflow-hidden rounded-[20px] bg-card shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
    <PrivateBikePhoto bike={bike} className="h-44 w-full rounded-none" />
    <div className="space-y-1 p-5">
      <h2 className="break-words text-[22px] font-semibold">{name}</h2>
      <p className="text-[15px] text-muted-foreground">{bike.make} {bike.model} · {bike.year ?? 'Year not recorded'}</p>
      <p>{formatBikeMileage(bike.mileageKm, unit)}</p>
      <p className="text-[13px] text-muted-foreground">No maintenance recorded</p>
      {bike.archivedAt && <p className="text-[13px]">Archived</p>}
    </div>
  </Link>
}
