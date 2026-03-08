'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function AdminLogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/')
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      className="text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200"
    >
      Logout
    </Button>
  )
}
