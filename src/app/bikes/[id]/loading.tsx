export default function BikeDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-[1024px] px-4 py-6 md:px-[22px] md:py-10" aria-busy="true" aria-label="Loading">
      <div className="mb-4 h-6 w-20 animate-pulse rounded-full bg-muted" />
      <div className="mb-8 grid grid-cols-1 items-center gap-6 md:grid-cols-2 md:gap-10">
        <div className="aspect-[3/2] animate-pulse rounded-[20px] bg-muted" />
        <div className="space-y-3">
          <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
          <div className="h-12 w-56 animate-pulse rounded-[12px] bg-muted" />
          <div className="h-5 w-32 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[84px] animate-pulse rounded-[16px] bg-muted" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-[20px] bg-muted" />
    </div>
  )
}
