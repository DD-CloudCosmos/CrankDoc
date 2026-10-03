'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * App-wide error boundary: shown inside the normal layout (navigation stays)
 * when a page fails to load, e.g. when the database is unreachable.
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-[560px] flex-col items-center justify-center px-4 py-20 text-center">
      <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full bg-caution-background text-caution-foreground">
        <AlertTriangle className="h-7 w-7" />
      </span>
      <h1 className="mt-5 text-[28px] font-bold tracking-[-0.02em]">This page couldn&apos;t load</h1>
      <p className="mt-2 text-[17px] text-muted-foreground">
        Something went wrong on our side. Check your connection and try again. Guides you opened before still work offline.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="secondary">
          <Link href="/">Go home</Link>
        </Button>
      </div>
      {error.digest && <p className="mt-6 text-[13px] text-muted-foreground">Error reference {error.digest}</p>}
    </div>
  )
}
