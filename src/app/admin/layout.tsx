import type { Metadata } from 'next'
import { AdminLogoutButton } from './AdminLogoutButton'

export const metadata: Metadata = {
  title: 'Admin Dashboard — CrankDoc',
  robots: { index: false, follow: false },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      {/* Admin banner */}
      <div className="border-b border-amber-300/30 bg-amber-50 dark:bg-amber-950/20">
        <div className="container mx-auto flex items-center justify-between px-4 py-2">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
            Admin Dashboard
          </p>
          <AdminLogoutButton />
        </div>
      </div>
      {children}
    </div>
  )
}
