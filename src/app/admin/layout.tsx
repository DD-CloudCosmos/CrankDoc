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
      <div className="border-b border-separator bg-caution-background">
        <div className="mx-auto flex max-w-[1024px] items-center justify-between px-4 py-2 md:px-[22px]">
          <p className="text-sm font-medium text-caution-foreground">
            Admin Dashboard
          </p>
          <AdminLogoutButton />
        </div>
      </div>
      {children}
    </div>
  )
}
