import Link from 'next/link'
import { getAccount } from '@/lib/account'
import { AccountForm } from '../AccountForm'

export const dynamic = 'force-dynamic'

export default async function ResetPasswordPage() {
  const account = await getAccount()
  return (
    <main className="mx-auto max-w-lg space-y-5 px-5 py-8">
      <h1 className="text-3xl font-semibold">Reset your password</h1>
      {account ? <AccountForm resetPassword /> : <>
        <p role="alert">This recovery session is missing or expired.</p>
        <Link href="/account?error=invalid-link" className="inline-block min-h-11 py-3 text-link">Request a new recovery link</Link>
      </>}
    </main>
  )
}
