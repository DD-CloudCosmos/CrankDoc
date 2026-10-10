import { expect, it } from 'vitest'
import { jobFixture, taskFixture, templateFixture } from '@/test/garageFixtures'
import { applyTaskPatch, completeJob, createTasks } from './checklist'
const now='2026-10-10T12:00:00Z', later='2026-10-10T13:00:00Z'
it('creates fresh definitions without observations and leaves template unchanged',()=>{
 const template=templateFixture(); const before=structuredClone(template)
 const tasks=createTasks(template,()=>taskFixture().id)
 expect(tasks[0]).toEqual(taskFixture())
 tasks[0].label='Changed'; expect(template).toEqual(before)
})
it('closes on the last Done and reopens on unchecking without losing notes',()=>{
 const job=jobFixture();const done=applyTaskPatch(job,job.tasks[0].id,{state:'done',notes:'Kept'},now)
 expect(done).toMatchObject({status:'completed',closeReason:'all_done',closedAt:now,revision:2})
 expect(job.tasks[0].state).toBe('todo')
 const reopened=applyTaskPatch(done,job.tasks[0].id,{state:'todo'},later)
 expect(reopened).toMatchObject({status:'in_progress',closeReason:null,closedAt:null})
 expect(reopened.tasks[0]).toMatchObject({notes:'Kept',doneAt:null})
})
it('preserves Done and closure times for repeated Done and notes',()=>{
 const done=applyTaskPatch(jobFixture(),taskFixture().id,{state:'done'},now)
 const again=applyTaskPatch(done,taskFixture().id,{state:'done',notes:'More'},later)
 expect(again.tasks[0].doneAt).toBe(now);expect(again.closedAt).toBe(now)
})
it.each(['skipped','not_applicable'] as const)('requires reason and never auto closes %s',state=>{
 expect(()=>applyTaskPatch(jobFixture(),taskFixture().id,{state},now)).toThrow()
 expect(applyTaskPatch(jobFixture(),taskFixture().id,{state,reason:'Explained'},now).status).toBe('in_progress')
})
it('manual closure preserves unfinished work and remains closed when unchecked',()=>{
 const closed=completeJob(jobFixture(),now);expect(closed).toMatchObject({status:'partial',closeReason:'manual',closedAt:now})
 const done=applyTaskPatch(closed,taskFixture().id,{state:'done'},later)
 expect(done.status).toBe('completed');expect(done.closedAt).toBe(now)
 expect(applyTaskPatch(done,taskFixture().id,{state:'todo',notes:'Later'},later)).toMatchObject({status:'partial',closedAt:now})
 expect(applyTaskPatch(closed,taskFixture().id,{notes:'Notes'},later).closedAt).toBe(now)
 const excluded=applyTaskPatch(jobFixture(),taskFixture().id,{state:'not_applicable',reason:'Absent'},now)
 expect(completeJob(excluded,later).status).toBe('completed')
})
it('rejects unknown ids, duplicate ids, empty labels, excessive rows, invalid states and fields',()=>{
 expect(()=>applyTaskPatch(jobFixture(),'unknown',{},now)).toThrow()
 for(const tasks of [[],[taskFixture(),taskFixture()],[taskFixture({label:''})],Array(101).fill(taskFixture())]) expect(()=>completeJob(jobFixture({tasks}),now)).toThrow()
 expect(()=>applyTaskPatch(jobFixture(),taskFixture().id,{state:'fake'} as never,now)).toThrow()
 expect(()=>applyTaskPatch(jobFixture(),taskFixture().id,{notes:'x'.repeat(4001)},now)).toThrow()
 expect(()=>applyTaskPatch(jobFixture(),taskFixture().id,{label:'Changed'} as never,now)).toThrow()
 expect(()=>createTasks(templateFixture(),()=> 'invalid')).toThrow()
})
