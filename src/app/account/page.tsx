import { getAccount, safeReturnPath } from '@/lib/account'
import { AccountForm } from './AccountForm'

export const dynamic = 'force-dynamic'

interface AccountPageProps {
  searchParams: Promise<{ next?: string; error?: string }>
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const [account, params] = await Promise.all([getAccount(), searchParams])
  return (
    <main className="mx-auto max-w-lg space-y-5 px-5 py-8">
      <h1 className="text-3xl font-semibold">Your account</h1>
      <p className="text-muted-foreground">Browse without an account. Sign in to save your garage.</p>
      <AccountForm signedIn={Boolean(account)} next={safeReturnPath(params.next ?? null)} invalidLink={params.error === 'invalid-link'} />
    </main>
  )
}
