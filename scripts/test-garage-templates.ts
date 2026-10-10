import assert from 'node:assert/strict'
import { createLocalTestClients } from './garage-test-env'
import { saveCustomTemplate, listTemplates, templateFromJob } from '../src/lib/maintenance/templates'
import { startJob, getJob } from '../src/lib/maintenance/jobsRepository.server'
import { createTasks } from '../src/lib/maintenance/checklist'
import { jobFixture, bikeFixture } from '../src/test/garageFixtures'
import type { Json } from '../src/types/database.types'
async function main() {
const env=await createLocalTestClients()
try {
 const accountA={client:env.a,userId:env.userA},accountB={client:env.b,userId:env.userB}
 const bikeId=crypto.randomUUID()
 assert.equal((await env.a.from('garage_bikes').insert({id:bikeId,owner_id:env.userA,make:'Honda',model:'Unlisted'})).error,null)
 const template=templateFromJob(jobFixture(),crypto.randomUUID(),'Private checklist')
 const first=await saveCustomTemplate(accountA,template)
 assert.equal(first.version,1)
 assert.equal((await listTemplates(accountB,bikeFixture())).length,0)
 const direct=await env.b.from('maintenance_templates').select('*').eq('id',first.id);assert.equal(direct.data?.length,0)
 const denied=await env.b.from('maintenance_templates').update({title:'Intrusion'}).eq('id',first.id).select();assert.equal(denied.data?.length,0)
 assert.ok((await env.b.from('maintenance_templates').insert({id:crypto.randomUUID(),owner_id:env.userA,version:1,title:first.title,definition:first as unknown as Json})).error)
 await assert.rejects(()=>saveCustomTemplate(accountB,first))
 const draft={...jobFixture(),id:crypto.randomUUID(),bikeId,template:first,tasks:createTasks(first,()=>crypto.randomUUID())}
 const started=await startJob(accountA,draft);assert.equal(started.ok,true)
 const second=await saveCustomTemplate(accountA,{...first,title:'Updated',tasks:[{...first.tasks[0],label:'Changed'}]})
 assert.equal(second.version,2)
 assert.notEqual(second.tasks[0].key,first.tasks[0].key)
 const saved=await getJob(accountA,draft.id);assert.equal(saved?.template?.version,1);assert.equal(saved?.tasks[0].label,first.tasks[0].label)
 const recovered=await startJob(accountA,{...draft,template:second,tasks:createTasks(second,()=>crypto.randomUUID())})
 assert.equal(recovered.ok,true);if(recovered.ok){assert.equal(recovered.value.id,draft.id);assert.equal(recovered.value.template?.version,1)}
 assert.equal((await env.a.from('maintenance_jobs').select('id').eq('bike_id',bikeId)).data?.length,1)
 await assert.rejects(()=>saveCustomTemplate(accountA,first),/changed/)
 for(const mutation of [{tasks:[]},{tasks:[{...first.tasks[0],key:null}]},{tasks:[first.tasks[0],first.tasks[0]]},{tasks:[{...first.tasks[0],state:'done'}]},{kind:'scheduled'},{version:0}]) {
  const id=crypto.randomUUID(),definition={...first,id,...mutation}
  const result=await env.a.from('maintenance_templates').insert({id,owner_id:env.userA,version:definition.version,title:definition.title,definition:definition as unknown as Json})
  assert.ok(result.error,JSON.stringify(mutation))
 }
 await env.a.auth.signOut()
 assert.ok((await env.a.from('maintenance_templates').select('*')).error)
 console.log('PASS private template ownership, direct-write validation, versions, conflicts and immutable job snapshots')
}finally{await env.cleanup()}

}
main().catch(error=>{console.error(error);process.exitCode=1})
