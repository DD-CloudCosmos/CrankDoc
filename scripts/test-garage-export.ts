import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {existsSync,lstatSync,renameSync} from 'node:fs'
import {dirname} from 'node:path'
import {tmpdir} from 'node:os'
import {setTimeout as pause} from 'node:timers/promises'
import {createServerClient} from '@supabase/ssr'
import {createLocalTestClients,loadGarageTestEnv} from './garage-test-env'
import {listJobs} from '../src/lib/maintenance/jobsRepository.server'
import {listPrivateFiles} from '../src/lib/maintenance/uploads.server'
import {listBikes,editBike} from '../src/lib/garageRepository.server'

async function main() {
 const env=loadGarageTestEnv();const t=await createLocalTestClients()
 const account={client:t.a,userId:t.userA};const bike=crypto.randomUUID();const otherBike=crypto.randomUUID()
 const live='.env.local';const excluded='.env.local.garage-export-excluded'
 let server:ReturnType<typeof spawn>|undefined;let before:number|undefined
 try {
  assert.ifError((await t.admin.from('garage_bikes').insert([bike,otherBike].map(id=>({id,owner_id:t.userA,make:'Honda',model:'CB650RA',motorcycle_id:t.modelId,year:2023})))).error)
  const jobs=Array.from({length:1001},(_,i)=>({id:crypto.randomUUID(),owner_id:t.userA,bike_id:bike,title:`Recorded work ${i}`,job_date:i===1000?'2026-10-10':i===999?'2026-10-09':'2026-10-08',mileage_km:i,tasks:[{id:crypto.randomUUID(),key:null,label:'Recorded task',action:'replace',state:'done',reason:'',notes:'',doneAt:'2026-10-10T12:00:00Z',origin:null,reference:null,warning:null,specification:null,safety:null}],status:'completed',close_reason:'all_done',closed_at:'2026-10-10T12:00:00Z'}))
  assert.ifError((await t.admin.from('maintenance_jobs').insert(jobs)).error)
  const files=jobs.map(job=>{const id=crypto.randomUUID();return {id,owner_id:t.userA,bike_id:bike,job_id:job.id,kind:'receipt',path:`${t.userA}/jobs/${job.id}/${id}.pdf`,filename:`${job.title}.pdf`}})
  // Pagination fixtures exercise metadata only: no 1,001-object storage upload is needed.
  assert.ifError((await t.admin.from('garage_file_states').insert(files.map(file=>({id:file.id,owner_id:file.owner_id,bike_id:file.bike_id,job_id:file.job_id,kind:file.kind,path:file.path,state:'finalizing'})))).error)
  assert.ifError((await t.admin.from('garage_files').insert(files)).error)
  assert.ifError((await t.admin.from('garage_file_states').update({state:'active'}).eq('bike_id',bike)).error)
  assert.equal((await t.a.from('maintenance_jobs').select('id').eq('bike_id',bike)).data?.length,1000,'Actual local API caps unpaged jobs at 1,000')
  assert.equal((await t.a.from('garage_files').select('id').eq('bike_id',bike)).data?.length,1000,'Actual local API caps unpaged files at 1,000')
  assert.equal((await listJobs(account,bike)).length,1001)
  assert.equal((await listPrivateFiles(account,bike)).length,1001)
  assert.equal((await listJobs({client:t.b,userId:t.userB},bike)).length,0)
  let cards=await listBikes(account)
  assert.equal(cards.find(item=>item.id===bike)?.latestJob?.title,'Recorded work 1000')
  assert.equal(cards.find(item=>item.id===otherBike)?.latestJob,null,'Same-model physical bike has no inherited history')
  const initial=cards.find(item=>item.id===bike)!
  const unlinked=await editBike(account,bike,{...initial,motorcycleId:null,make:'Unlisted make',model:'Unlisted model'})
  assert.equal(unlinked.id,bike);assert.equal((await listJobs(account,bike)).length,1001,'Unlink keeps history')
  await assert.rejects(()=>editBike(account,bike,{...initial,year:2024}),/Year outside/)
  const relinked=await editBike(account,bike,{...initial,year:2023})
  assert.equal(relinked.id,bike);assert.equal((await listJobs(account,bike)).length,1001,'Relink keeps history')
  for(const name of ['.env','.env.production','.env.production.local',excluded])assert.equal(existsSync(name),false,'Unexpected environment file')
  const cookies=new Map<string,string>();const {data:{session}}=await t.a.auth.getSession();assert.ok(session)
  const auth=createServerClient(env.url,env.anonKey,{cookies:{getAll:()=>[...cookies].map(([name,value])=>({name,value})),setAll:values=>{for(const cookie of values)cookies.set(cookie.name,cookie.value)}}})
  assert.ifError((await auth.auth.setSession(session)).error)
  before=lstatSync(live).ino;renameSync(live,excluded)
  server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3113'],{env:{PATH:`${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,TMPDIR:tmpdir(),NODE_ENV:'production',NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_SUPABASE_URL:env.url,NEXT_PUBLIC_SUPABASE_ANON_KEY:env.anonKey,SUPABASE_SERVICE_ROLE_KEY:env.serviceKey,NEXT_PUBLIC_SITE_URL:'http://127.0.0.1:3113'},stdio:'ignore'})
  let ready=false
  for(let i=0;i<100;i++){if(server.exitCode!==null)throw new Error('Built server exited');try {await fetch('http://127.0.0.1:3113/api/garage/export');ready=true;break}catch{await pause(100)}}assert.ok(ready,'Built server starts')
  const url=`http://127.0.0.1:3113/api/garage/export?bikeId=${bike}&format=`
  const headers={Cookie:[...cookies].map(([name,value])=>`${name}=${value}`).join('; ')}
  const json=await fetch(`${url}json`,{headers});assert.equal(json.status,200)
  const exported=await json.json();assert.equal(exported.jobs.length,1001);assert.equal(exported.files.length,1001)
  const csv=await fetch(`${url}csv`,{headers});assert.equal(csv.status,200);assert.equal((await csv.text()).split('\r\n').length,1002)
  assert.equal((await fetch(`${url}json`)).status,401)
  assert.equal((await fetch(`http://127.0.0.1:3113/api/garage/export?bikeId=${crypto.randomUUID()}&format=json`,{headers})).status,404)
  assert.ifError((await t.admin.from('garage_files').delete().eq('job_id',jobs[1000].id)).error)
  assert.ifError((await t.a.from('maintenance_jobs').delete().eq('id',jobs[1000].id)).error)
  cards=await listBikes(account);assert.equal(cards.find(item=>item.id===bike)?.latestJob?.title,'Recorded work 999','Deleting latest falls back to preceding recorded job')
  console.log('PASS: actual API 1,000 cap, complete built JSON/CSV with 1,001 jobs/files, owner scope, per-bike summaries/delete fallback, unlink/relink/history/year scope')
 } finally {
  if(server){server.kill('SIGTERM');await new Promise<void>(resolve=>{if(server!.exitCode!==null)resolve();else server!.once('exit',()=>resolve())})}
  if(before!==undefined){renameSync(excluded,live);assert.equal(lstatSync(live).ino,before);console.log('PASS: live environment restored unchanged')}
  assert.ifError((await t.admin.from('garage_files').delete().in('bike_id',[bike,otherBike])).error)
  assert.ifError((await t.admin.from('maintenance_jobs').delete().in('bike_id',[bike,otherBike])).error)
  assert.ifError((await t.admin.from('garage_bikes').delete().in('id',[bike,otherBike])).error)
  await t.cleanup()
 }
}
main().catch(error=>{console.error(error instanceof Error?error.message:'Export verification failed');process.exitCode=1})
