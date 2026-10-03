import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[560px] px-4 py-20 text-center">
      <h1 className="mb-3 text-[34px] font-bold tracking-[-0.025em]">Diagnostic Tree Not Found</h1>
      <p className="mb-8 text-[17px] text-muted-foreground">
        The diagnostic tree you&apos;re looking for doesn&apos;t exist or has been removed.
      </p>
      <Button asChild>
        <Link href="/diagnose">Browse All Diagnostics</Link>
      </Button>
    </div>
  )
}
