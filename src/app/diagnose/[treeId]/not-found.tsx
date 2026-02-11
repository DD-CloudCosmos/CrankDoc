import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="mb-4 text-3xl font-bold">Diagnostic Tree Not Found</h1>
      <p className="mb-8 text-muted-foreground">
        The diagnostic tree you&apos;re looking for doesn&apos;t exist or has been removed.
      </p>
      <Link href="/diagnose">
        <Button>Browse All Diagnostics</Button>
      </Link>
    </div>
  )
}
