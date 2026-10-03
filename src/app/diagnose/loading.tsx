export default function DiagnoseLoading() {
  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-6 md:px-[22px] md:py-10" aria-busy="true" aria-label="Loading">
      <div className="mx-auto mb-8 flex max-w-xs justify-between">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 w-8 animate-pulse rounded-full bg-muted" />
        ))}
      </div>
      <div className="mb-6 h-10 w-48 animate-pulse rounded-[12px] bg-muted" />
      <div className="mb-5 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-11 w-24 animate-pulse rounded-full bg-muted" />
        ))}
      </div>
      <div className="overflow-hidden rounded-[12px] bg-card shadow-card">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex h-[62px] items-center gap-3 border-b border-separator px-4 last:border-b-0">
            <div className="h-4 w-1/2 animate-pulse rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
