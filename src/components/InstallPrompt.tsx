'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!deferredPrompt || dismissed) return null

  const handleInstall = async () => {
    await deferredPrompt.prompt()
    setDeferredPrompt(null)
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-lg md:bottom-4">
      <div className="flex items-center gap-3">
        <Download className="h-5 w-5 text-primary" />
        <div>
          <p className="text-sm font-medium">Install CrankDoc</p>
          <p className="text-xs text-muted-foreground">Add to your home screen for quick access</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleInstall}>Install</Button>
        <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
