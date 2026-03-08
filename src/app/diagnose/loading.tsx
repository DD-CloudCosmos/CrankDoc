export default function DiagnoseLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto mb-8 flex max-w-xs justify-between">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 w-10 animate-pulse rounded-full bg-muted" />
        ))}
      </div>
      <div className="mx-auto max-w-2xl rounded-[24px] bg-card p-6">
        <div className="mb-4 h-8 w-56 animate-pulse rounded-[16px] bg-muted" />
        <div className="mb-6 flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 w-24 animate-pulse rounded-[999px] bg-muted" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-[24px] bg-muted" />
          ))}
        </div>
      </div>
    </div>
  )
}
