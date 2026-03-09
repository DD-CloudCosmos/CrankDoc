'use client'

import { useEffect, useRef } from 'react'

export function ServiceWorkerRegistration() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Check for updates periodically (every 60 minutes)
          intervalRef.current = setInterval(
            () => {
              registration.update().catch(() => {
                // Silently ignore update check failures (offline, etc.)
              })
            },
            60 * 60 * 1000
          )

          // Detect when a new SW is waiting to activate
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (!newWorker) return

            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // New version available — tell the SW to activate immediately
                newWorker.postMessage({ type: 'SKIP_WAITING' })
              }
            })
          })
        })
        .catch((err) => {
          console.error('SW registration failed:', err)
        })
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return null
}
