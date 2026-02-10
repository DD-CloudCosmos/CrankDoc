import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <h2 className="mb-2 text-2xl font-semibold">Motorcycle Not Found</h2>
        <p className="mb-6 text-muted-foreground">
          The motorcycle you are looking for does not exist or has been removed.
        </p>
        <Link href="/bikes">
          <Button>Browse all motorcycles</Button>
        </Link>
      </div>
    </div>
  )
}
