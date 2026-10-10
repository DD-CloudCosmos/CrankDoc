import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createLocalTestClients } from './garage-test-env'
import { addBike } from '../src/lib/garageRepository.server'
import { getJob, startJob, saveTaskPatch } from '../src/lib/maintenance/jobsRepository.server'
import { jobFixture,taskFixture } from '../src/test/garageFixtures'
import type { CarrySelection } from '../src/lib/maintenance/carryover'
const {Client}=createRequire(import.meta.url)('pg')
async function main() {
 const {a,b,admin,userA,userB,cleanup}=await createLocalTestClients()
 const account={client:a,userId:userA},foreign={client:b,userId:userB}
 const sql=new Client({connectionString:'postgresql://postgres:postgres@127.0.0.1:54322/postgres'})
 await sql.connect()
 try {
  const input={motorcycleId:null,nickname:'',make:'Test',model:'Carry',year:null,variant:'',market:'',registration:'',mileageKm:0}
  const bike=await addBike(account,input,crypto.randomUUID()),other=await addBike(account,input,crypto.randomUUID())
  const sourceDraft=jobFixture({id:crypto.randomUUID(),bikeId:bike.id,date:'2099-01-01',tasks:[taskFixture({id:crypto.randomUUID(),notes:''})]})
  const sourceStart=await startJob(account,sourceDraft);assert.ok(sourceStart.ok)
  const observed=await saveTaskPatch(account,sourceDraft.id,1,sourceDraft.tasks[0].id,{notes:'<b>Old observation</b>',state:'skipped',reason:'Later'});assert.ok(observed.ok)
  const choice:CarrySelection={sourceJobId:sourceDraft.id,sourceRevision:2,taskIds:[sourceDraft.tasks[0].id],closePrevious:true}
  const draft=()=>jobFixture({id:crypto.randomUUID(),bikeId:bike.id,date:'2000-01-01',tasks:[taskFixture({id:crypto.randomUUID(),key:'new',state:'done',doneAt:new Date().toISOString()})]})
  async function unchanged(candidate:ReturnType<typeof draft>,selection:CarrySelection,owner=account) {
   const before=await getJob(account,sourceDraft.id)
   const result=await startJob(owner,candidate,selection);assert.equal(result.ok,false)
   assert.equal(await getJob(account,candidate.id),null);assert.deepEqual(await getJob(account,sourceDraft.id),before)
   return result
  }
  assert.equal((await unchanged(draft(),{...choice,sourceRevision:1})).ok,false)
  await unchanged({...draft(),bikeId:other.id},choice)
  await unchanged(draft(),choice,foreign)
  await unchanged(draft(),{...choice,taskIds:[crypto.randomUUID()]})
  await unchanged(draft(),{...choice,taskIds:[choice.taskIds[0],choice.taskIds[0]]})
  await unchanged({...draft(),tasks:Array.from({length:100},()=>taskFixture({id:crypto.randomUUID(),key:null}))},choice)
  await unchanged({...draft(),tasks:[taskFixture({id:crypto.randomUUID(),origin:{jobId:sourceDraft.id,taskId:choice.taskIds[0],previousNotes:'Forged'}})]},choice)
  // Force errors on insertion and on source closure, after the insert has happened.
  await sql.query(`create function public.c3_test_failure() returns trigger language plpgsql as $$ begin if NEW.title='C3 insert failure' or (TG_OP='UPDATE' and NEW.id='${sourceDraft.id}'::uuid and NEW.close_reason='manual') then raise exception 'C3 forced failure'; end if; return NEW; end $$`)
  await sql.query('create trigger c3_test_failure before insert or update on public.maintenance_jobs for each row execute function public.c3_test_failure()')
  try {
   await unchanged({...draft(),title:'C3 insert failure'},{...choice,closePrevious:false})
   await unchanged(draft(),choice)
  } finally {
   await sql.query('drop trigger c3_test_failure on public.maintenance_jobs');await sql.query('drop function public.c3_test_failure()')
  }
  const fresh={...draft(),tasks:[...draft().tasks,taskFixture({id:crypto.randomUUID(),state:'done',doneAt:new Date().toISOString(),label:'Updated definition',specification:'New specification',notes:'New notes'})]}
  const retries=await Promise.all([startJob(account,fresh,choice),startJob(account,fresh,choice)])
  for(const result of retries) assert.ok(result.ok)
  assert.deepEqual(retries[0],retries[1])
  const started=retries[0];assert.ok(started.ok)
  assert.equal(started.value.status,'in_progress');assert.equal(started.value.tasks[0].state,'done')
  const carried=started.value.tasks[1];assert.equal(carried.label,'Updated definition');assert.equal(carried.specification,'New specification');assert.equal(carried.state,'todo');assert.equal(carried.notes,'');assert.equal(carried.doneAt,null)
  assert.deepEqual(carried.origin,{jobId:sourceDraft.id,taskId:choice.taskIds[0],previousNotes:'<b>Old observation</b>'})
  const closed=await getJob(account,sourceDraft.id);assert.equal(closed?.status,'partial');assert.equal(closed?.revision,3)
  assert.equal(closed?.date,'2099-01-01');assert.equal(closed?.mileageKm,12000);assert.deepEqual(closed?.tasks,observed.value.tasks)
  assert.ok((await saveTaskPatch(account,fresh.id,1,carried.id,{state:'done'})).ok)
  assert.deepEqual(await getJob(account,sourceDraft.id),closed)
  // Latest means creation order, even though the original has a later recorded date.
  const wrongPrevious=await startJob(account,draft(),{...choice,sourceRevision:3,closePrevious:false});assert.ok(!wrongPrevious.ok&&wrongPrevious.error==='conflict')
  // Closed latest activity can still supply unfinished work when closure is unchecked.
  const closedSourceId=crypto.randomUUID(),closedTask=taskFixture({id:crypto.randomUUID(),notes:'Closed work'})
  assert.ifError((await admin.from('maintenance_jobs').insert({id:closedSourceId,owner_id:userA,bike_id:bike.id,title:'Closed source',job_date:'1999-01-01',mileage_km:0,tasks:[closedTask],status:'partial',close_reason:'manual',closed_at:new Date().toISOString(),created_at:'2100-01-01T00:00:00Z'})).error)
  const closedChoice={sourceJobId:closedSourceId,sourceRevision:1,taskIds:[closedTask.id],closePrevious:true}
  assert.equal((await startJob(account,draft(),closedChoice)).ok,false)
  const copy=await startJob(account,draft(),{...closedChoice,closePrevious:false});assert.ok(copy.ok)
  assert.equal((await getJob(account,closedSourceId))?.revision,1)
  const raceBike=await addBike(account,input,crypto.randomUUID())
  const raceDraft=jobFixture({id:crypto.randomUUID(),bikeId:raceBike.id,tasks:[taskFixture({id:crypto.randomUUID()})]})
  assert.ok((await startJob(account,raceDraft)).ok)
  const raceChoice={sourceJobId:raceDraft.id,sourceRevision:1,taskIds:[raceDraft.tasks[0].id],closePrevious:true}
  const racing=await Promise.all([startJob(account,{...draft(),bikeId:raceBike.id},raceChoice),saveTaskPatch(account,raceDraft.id,1,raceDraft.tasks[0].id,{notes:'Other device'})])
  assert.equal(racing.filter(result=>result.ok).length,1)
  assert.equal(racing.filter(result=>!result.ok&&result.error==='conflict').length,1)
  // Opening a newer activity without a selection does not close the previous one.
  const noChoiceBike=await addBike(account,input,crypto.randomUUID())
  const old=jobFixture({id:crypto.randomUUID(),bikeId:noChoiceBike.id,tasks:[taskFixture({id:crypto.randomUUID()})]})
  assert.ok((await startJob(account,old)).ok);const before=await getJob(account,old.id)
  assert.ok((await startJob(account,{...draft(),bikeId:noChoiceBike.id})).ok)
  assert.deepEqual(await getJob(account,old.id),before)
  console.log('PASS: local two-owner carry transaction, retries, conflicts, counts, insert/closure rollback, latest creation order and historical facts')
 } finally {await sql.end();await cleanup()}
}
main().catch(error=>{console.error(error);process.exitCode=1})
