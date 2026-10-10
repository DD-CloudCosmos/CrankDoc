import {getAccount} from '@/lib/account'
import {requireBikeId} from '@/lib/garageBikes'
import {getBike} from '@/lib/garageRepository.server'
import {listJobs} from '@/lib/maintenance/jobsRepository.server'
import {listPrivateFiles} from '@/lib/maintenance/uploads.server'
import {exportBikeCsv,exportBikeJson} from '@/lib/maintenance/export'
export const dynamic='force-dynamic'
export const runtime='nodejs'
const privateHeaders={'Cache-Control':'private, no-store'}
function failure(message:string,status:number) {return Response.json({message},{status,headers:privateHeaders})}
export async function GET(request:Request) {
 const account=await getAccount()
 if(!account) return failure('Sign in to export records.',401)
 const query=new URL(request.url).searchParams
 const format=query.get('format')
 if(format!=='json'&&format!=='csv') return failure('Choose JSON or CSV.',400)
 let bikeId:string
 try {bikeId=requireBikeId(query.get('bikeId'))} catch {return failure('Invalid bike identifier.',400)}
 try {
  const bike=await getBike(account,bikeId)
  if(!bike) return failure('Bike not found.',404)
  const jobs=await listJobs(account,bike.id)
  const files=format==='json'?(await listPrivateFiles(account,bike.id)).filter(file=>file.bikeId===bike.id&&!file.cleanupPending):[]
  const body=format==='json'?exportBikeJson(bike,jobs,files):exportBikeCsv(bike,jobs)
  const name=(bike.nickname||bike.id).replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,80)||bike.id
  return new Response(body,{headers:{...privateHeaders,'Content-Type':format==='json'?'application/json; charset=utf-8':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="${name}.${format}"`}})
 } catch {return failure('Could not export records. Retry.',500)}
}
