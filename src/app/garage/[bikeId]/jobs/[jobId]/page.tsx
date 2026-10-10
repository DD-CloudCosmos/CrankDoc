import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAccount } from '@/lib/account'
import { getBike } from '@/lib/garageRepository.server'
import { getJob } from '@/lib/maintenance/jobsRepository.server'
import { requireJobId } from '@/lib/maintenance/validation'
import { PrivateGarage } from '../../../PrivateGarage'
import { Checklist } from '../../Checklist'
export const dynamic='force-dynamic'
export default async function JobPage({params}:{params:Promise<{bikeId:string;jobId:string}>}) {
 const {bikeId,jobId}=await params
 try {requireJobId(bikeId);requireJobId(jobId)}catch{notFound()}
 const account=await getAccount()
 if(!account)return <main className="mx-auto max-w-lg px-5 py-8"><Link className="inline-block min-h-11 py-3 text-link" href={`/account?next=${encodeURIComponent(`/garage/${bikeId}/jobs/${jobId}`)}`}>Sign in to open this job</Link></main>
 const bike=await getBike(account,bikeId)
 if(!bike)notFound()
 const job=await getJob(account,jobId)
 if(!job || job.bikeId!==bike.id)notFound()
 return <main className="mx-auto max-w-2xl px-5 py-8"><PrivateGarage key={account.userId} ownerId={account.userId}><Link prefetch={false} className="inline-block min-h-11 py-3 text-link" href={`/garage/${bike.id}`}>Back to bike</Link><p className="mb-3 break-words">{bike.nickname || `${bike.make} ${bike.model}`} · {bike.make} {bike.model}</p><Checklist initialJob={job} /></PrivateGarage></main>
}
