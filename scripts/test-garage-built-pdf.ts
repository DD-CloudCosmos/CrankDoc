import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {existsSync,lstatSync,readFileSync,renameSync} from 'node:fs'
import {dirname,resolve} from 'node:path'
import {tmpdir} from 'node:os'
import {setTimeout as pause} from 'node:timers/promises'
import {createServerClient} from '@supabase/ssr'
import {PDFDocument} from 'pdf-lib'
import {cleanupLocalFixtures,createLocalTestClients,loadGarageTestEnv} from './garage-test-env'

async function main() {
 const env=loadGarageTestEnv();const t=await createLocalTestClients()
 const live='.env.local';const excluded='.env.local.garage-http-excluded'
 const bike=crypto.randomUUID();const job=crypto.randomUUID();const paths:string[]=[]
 let server:ReturnType<typeof spawn>|undefined;let before:number|undefined;let failed=false
 try {
 for(const name of ['.env','.env.production','.env.production.local',excluded])assert.equal(existsSync(name),false,'Unexpected environment file')
 const cookies=new Map<string,string>();const {data:{session}}=await t.a.auth.getSession();assert.ok(session)
 const auth=createServerClient(env.url,env.anonKey,{cookies:{getAll:()=>[...cookies].map(([name,value])=>({name,value})),setAll:values=>{for(const cookie of values)cookies.set(cookie.name,cookie.value)}}})
 assert.ifError((await auth.auth.setSession(session)).error)
 before=lstatSync(live).ino;renameSync(live,excluded)
 server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3112'],{env:{PATH:`${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,TMPDIR:tmpdir(),NODE_ENV:'production',NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_SUPABASE_URL:env.url,NEXT_PUBLIC_SUPABASE_ANON_KEY:env.anonKey,SUPABASE_SERVICE_ROLE_KEY:env.serviceKey,NEXT_PUBLIC_SITE_URL:'http://127.0.0.1:3112'},stdio:'ignore'})
  let ready=false
  for(let i=0;i<100;i++){if(server.exitCode!==null)throw new Error('Built server exited');try {await fetch('http://127.0.0.1:3112/api/garage/files');ready=true;break}catch{await pause(100)}}assert.ok(ready,'Built server starts')
  assert.ifError((await t.a.from('garage_bikes').insert({id:bike,owner_id:t.userA,make:'Honda',model:'CB650RA',motorcycle_id:t.modelId,year:2023})).error)
  assert.ifError((await t.a.rpc('create_quick_job',{p_draft:{id:job,bikeId:bike,title:'Built PDF fixture',date:'2026-10-10',mileageKm:1,template:null,tasks:[{id:crypto.randomUUID(),key:null,label:'Fixture',action:'replace',state:'done',reason:'',notes:'',doneAt:'2026-10-10T12:00:00Z',origin:null,reference:null,warning:null,specification:null,safety:null}],notes:'',parts:'',performer:'',costMinor:null,currency:null}})).error)
  const pdf=await PDFDocument.create();pdf.addPage()
  for(const [bytes,status] of [[Buffer.from(await pdf.save()),200],[Buffer.from('%PDF-1.7\nreceipt\n%%EOF'),415],[Buffer.from('%PDF-1.7\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n%%EOF'),415]] as const){
   const id=crypto.randomUUID();const path=`${t.userA}/jobs/${job}/${id}.pdf.source`;paths.push(path,path.replace('.source',''))
   assert.ifError((await t.a.storage.from('garage-receipts').upload(path,bytes,{contentType:'application/pdf'})).error)
   const response=await fetch('http://127.0.0.1:3112/api/garage/files',{method:'POST',headers:{'Content-Type':'application/json',Cookie:[...cookies].map(([name,value])=>`${name}=${value}`).join('; ')},body:JSON.stringify({id,bikeId:bike,jobId:job,kind:'receipt',path,filename:'receipt.pdf'})})
   assert.equal(response.status,status,'Built HTTP PDF finalization status')
   if(status===200){const result=await response.json();assert.equal(result.id,id);assert.equal(result.path,path.replace('.source',''));assert.ifError((await t.a.storage.from('garage-receipts').download(result.path)).error)}
  }
  const trace=JSON.parse(readFileSync('.next/server/app/api/garage/files/route.js.nft.json','utf8')) as {files:string[]}
  for(const dependency of ['pdf-lib','@pdf-lib/standard-fonts','@pdf-lib/upng','pako','tslib'])assert.ok(trace.files.some(file=>resolve('.next/server/app/api/garage/files',file).includes(`/node_modules/${dependency}/`)),`Trace includes ${dependency}`)
  console.log('PASS: built HTTP valid PDF 200, malformed PDFs 415, PDF dependency traces')
 } catch(error) {failed=true;throw error} finally {
  await cleanupLocalFixtures([
   async()=>{if(server){server.kill('SIGTERM');await new Promise<void>(resolve=>{if(server!.exitCode!==null)resolve();else server!.once('exit',()=>resolve())})}},
   async()=>{if(before!==undefined){renameSync(excluded,live);assert.equal(lstatSync(live).ino,before);console.log('PASS: live environment restored unchanged')}},
   ()=>t.admin.storage.from('garage-receipts').remove(paths),
   ()=>t.admin.from('garage_files').delete().eq('bike_id',bike),
   ()=>t.admin.from('garage_bikes').delete().eq('id',bike),
   ()=>t.cleanup(),
  ]).catch(error=>{if(failed)console.error('Cleanup also failed:',error);else throw error})
 }
}
main().catch(error=>{console.error(error instanceof Error?error.message:'Built PDF smoke failed');process.exitCode=1})
