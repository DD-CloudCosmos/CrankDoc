'use client'

import { useState, useEffect, useSyncExternalStore } from 'react'

function subscribeOnlineStatus(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

function getOnlineSnapshot() {
  return navigator.onLine
}

function getServerSnapshot() {
  return true
}

export function OfflineIndicator() {
  const isOnline = useSyncExternalStore(
    subscribeOnlineStatus,
    getOnlineSnapshot,
    getServerSnapshot
  )
  const isOffline = !isOnline
  const [showBackOnline, setShowBackOnline] = useState(false)

  // Subscribe to online event to trigger "back online" banner
  useEffect(() => {
    const handleOnline = () => setShowBackOnline(true)
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])

  // Auto-hide "back online" after 3 seconds
  useEffect(() => {
    if (!showBackOnline) return
    const timer = setTimeout(() => setShowBackOnline(false), 3000)
    return () => clearTimeout(timer)
  }, [showBackOnline])

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
