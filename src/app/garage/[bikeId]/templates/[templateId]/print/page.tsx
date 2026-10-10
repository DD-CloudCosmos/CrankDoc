import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAccount } from '@/lib/account'
import { getBike } from '@/lib/garageRepository.server'
import { listTemplates } from '@/lib/maintenance/templates'
import { matchesCoverage } from '@/lib/maintenance/templateValidation'
import { requireJobId } from '@/lib/maintenance/validation'
import { PrivateGarage } from '../../../../PrivateGarage'
import { BlankPrintChecklist } from '../../../PrintChecklist'
export const dynamic='force-dynamic'
export default async function TemplatePrintPage({params}:{params:Promise<{bikeId:string;templateId:string}>}) {
 const {bikeId,templateId}=await params
 try{requireJobId(bikeId)}catch{notFound()}
 const account=await getAccount()
 if(!account)return <main><Link href={`/account?next=${encodeURIComponent(`/garage/${bikeId}/templates/${templateId}/print`)}`}>Sign in to print this template</Link></main>
 const bike=await getBike(account,bikeId)
 if(!bike)notFound()
 const template=(await listTemplates(account,bike)).find(item=>item.id===templateId && matchesCoverage(item,bike))
 if(!template)notFound()
 return <main className="garage-print-page mx-auto max-w-2xl px-5 py-8"><PrivateGarage key={account.userId} ownerId={account.userId}><Link prefetch={false} className="garage-print-action inline-block min-h-11 py-3 text-link" href={`/garage/${bike.id}`}>Back to bike</Link><BlankPrintChecklist bike={bike} template={template} /></PrivateGarage></main>
}
