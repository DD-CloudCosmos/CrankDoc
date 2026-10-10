import { expect, it } from 'vitest'
import { jobFixture, taskFixture } from '@/test/garageFixtures'
import { appendCarriedTasks, carryCandidates, previousActivity } from './carryover'
it('offers only unfinished work from the latest created job',()=>{
 const source=jobFixture({tasks:['todo','skipped','done','not_applicable'].map((state,i)=>taskFixture({id:String(i),state:state as never}))})
 expect(carryCandidates(source).map(t=>t.id)).toEqual(['0','1'])
 expect(previousActivity([jobFixture({id:'a',date:'2099-01-01'}),jobFixture({id:'b',date:'2000-01-01'})])?.id).toBe('b')
})
it('merges stable keys while keeping new definitions and original facts',()=>{
 const source=jobFixture({tasks:[taskFixture({notes:'<b>Noise</b>',state:'skipped',reason:'Later'})]})
 const target=taskFixture({id:'new',specification:'New value',notes:''})
 const result=appendCarriedTasks([target],source,[source.tasks[0].id],()=> 'fresh')
 expect(result).toEqual([{...target,origin:{jobId:source.id,taskId:source.tasks[0].id,previousNotes:'<b>Noise</b>'}}])
 expect(source.tasks[0]).toMatchObject({state:'skipped',notes:'<b>Noise</b>'})
})
it('copies custom and different-key rows as fresh pending tasks',()=>{
 const source=jobFixture({tasks:[taskFixture({key:null,notes:'Old'}),taskFixture({id:'other',key:'other',state:'skipped',reason:'Later'})]})
 const result=appendCarriedTasks([taskFixture()],source,source.tasks.map(t=>t.id),(()=>{let id=0;return ()=>String(++id)})())
 expect(result).toHaveLength(3)
 expect(result.slice(1)).toMatchObject([{id:'1',state:'todo',notes:'',reason:'',doneAt:null},{id:'2',state:'todo',notes:'',reason:'',doneAt:null}])
})
it('resets a matching row to pending without changing its new specification',()=>{
 const source=jobFixture()
 const result=appendCarriedTasks([taskFixture({state:'done',doneAt:'2026-10-10T00:00:00Z',notes:'Current',specification:'New'})],source,[source.tasks[0].id],()=> 'unused')
 expect(result[0]).toMatchObject({state:'todo',doneAt:null,notes:'',reason:'',specification:'New'})
})
