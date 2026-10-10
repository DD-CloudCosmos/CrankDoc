import Link from 'next/link'
import { getAccount } from '@/lib/account'
import { listBikes } from '@/lib/garageRepository.server'
import { GarageCollection } from './GarageCollection'
import { PrivateGarage } from './PrivateGarage'
export const dynamic = 'force-dynamic'
export default async function GaragePage() {
  const account = await getAccount()
  if (!account) return <main className="mx-auto max-w-lg space-y-4 px-5 py-8"><h1 className="text-[34px] font-semibold">My Garage</h1><p>Sign in to keep your own bikes and maintenance records.</p><Link href="/account?next=/garage" className="inline-block min-h-11 py-3 text-link">Sign in</Link></main>
  const bikes = await listBikes(account)
  const { data, error } = await account.client.from('motorcycles').select('id, make, model, year_start, year_end').order('make').order('model')
  if (error) throw new Error('Could not load model library')
  return <main className="mx-auto max-w-[1024px] px-5 py-8"><PrivateGarage key={account.userId} ownerId={account.userId}><GarageCollection initialBikes={bikes} models={data ?? []} /></PrivateGarage></main>
}
