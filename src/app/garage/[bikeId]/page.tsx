import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAccount } from '@/lib/account'
import { getBike } from '@/lib/garageRepository.server'
import { listJobs } from '@/lib/maintenance/jobsRepository.server'
import { requireBikeId } from '@/lib/garageBikes'
import { PrivateGarage } from '../PrivateGarage'
import { BikeWorkspace } from './BikeWorkspace'
export const dynamic = 'force-dynamic'
export default async function BikePage({ params }: { params: Promise<{ bikeId: string }> }) {
  const { bikeId } = await params
  try { requireBikeId(bikeId) } catch { notFound() }
  const account = await getAccount()
  if (!account) return <main className="mx-auto max-w-lg px-5 py-8"><h1 className="text-[34px] font-semibold">My Garage</h1><Link href={`/account?next=${encodeURIComponent(`/garage/${bikeId}`)}`} className="inline-block min-h-11 py-3 text-link">Sign in to open this bike</Link></main>
  const bike = await getBike(account, bikeId)
  if (!bike) notFound()
  const {data:models,error}=await account.client.from('motorcycles').select('id,make,model,year_start,year_end').order('make').order('model')
  if(error) throw new Error('Could not load model library')
  return <main className="mx-auto max-w-2xl px-5 py-8"><PrivateGarage key={account.userId} ownerId={account.userId}><BikeWorkspace models={models??[]} bike={bike} jobs={await listJobs(account,bikeId)} /></PrivateGarage></main>
}
