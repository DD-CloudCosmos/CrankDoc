'use client'

import { useState, useEffect, useCallback } from 'react'

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(
    () => typeof navigator !== 'undefined' && !navigator.onLine
  )
  const [showBackOnline, setShowBackOnline] = useState(false)

  const handleOffline = useCallback(() => {
    setIsOffline(true)
    setShowBackOnline(false)
  }, [])

  const handleOnline = useCallback(() => {
    setIsOffline(false)
    setShowBackOnline(true)
    const timer = setTimeout(() => setShowBackOnline(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [handleOffline, handleOnline])

  if (!isOffline && !showBackOnline) {
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-0 left-0 right-0 z-50 flex min-h-[44px] items-center justify-center px-4 py-2 text-center text-sm font-medium ${
        isOffline
          ? 'bg-amber-500 text-amber-950'
          : 'bg-emerald-500 text-emerald-950'
      }`}
    >
      {isOffline
        ? "You're offline — some features may be unavailable"
        : 'Back online'}
    </div>
  )
}
