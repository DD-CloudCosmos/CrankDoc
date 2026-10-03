import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-[560px] flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-[17px] font-semibold text-muted-foreground">404</p>
      <h1 className="mt-2 text-[34px] font-bold tracking-[-0.025em]">Motorcycle Not Found</h1>
      <p className="mb-8 mt-3 text-[17px] text-muted-foreground">
        The motorcycle you are looking for does not exist or has been removed.
      </p>
      <Button asChild>
        <Link href="/bikes">Browse all motorcycles</Link>
      </Button>
    </div>
  )
}
