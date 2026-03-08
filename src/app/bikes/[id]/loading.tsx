export default function BikeDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4 h-8 w-32 animate-pulse rounded-[16px] bg-muted" />
      <div className="mb-6 h-64 animate-pulse rounded-[24px] bg-muted" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-[24px] bg-muted" />
        ))}
      </div>
    </div>
  )
}
