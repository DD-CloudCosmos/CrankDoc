export default function BikesLoading() {
  return (
    <div className="mx-auto w-full max-w-[1024px] px-4 py-6 md:px-[22px] md:py-10" aria-busy="true" aria-label="Loading">
      <div className="mb-8 h-10 w-40 animate-pulse rounded-[12px] bg-muted" />
      <div className="mb-5 h-11 animate-pulse rounded-[10px] bg-muted" />
      <div className="mb-6 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-11 w-20 animate-pulse rounded-full bg-muted" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[3/2] animate-pulse rounded-[20px] bg-muted" />
            <div className="mt-3 h-4 w-3/4 animate-pulse rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
