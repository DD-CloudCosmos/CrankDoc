import type { Metadata } from 'next'

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
        <div className="container mx-auto px-4 py-2">
          <p className="text-center text-sm font-medium text-amber-700 dark:text-amber-400">
            Admin Dashboard
          </p>
        </div>
      </div>
      {/* TODO: Add auth check when admin auth is implemented */}
      {children}
    </div>
  )
}
