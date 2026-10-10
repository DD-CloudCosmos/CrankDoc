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

it('keeps every selected origin when valid source rows share a stable key',()=>{
 const source=jobFixture({tasks:[taskFixture({id:'first',notes:'First notes'}),taskFixture({id:'second',notes:'Second notes'})]})
 const target=taskFixture({id:'target',label:'New definition',specification:'New specification'})
 const result=appendCarriedTasks([target],source,['first','second'],()=> 'fresh')
 expect(result).toHaveLength(2)
 expect(result[0]).toMatchObject({id:'target',label:'New definition',specification:'New specification',origin:{taskId:'first',previousNotes:'First notes'}})
 expect(result[1]).toMatchObject({id:'fresh',state:'todo',notes:'',doneAt:null,origin:{taskId:'second',previousNotes:'Second notes'}})
 expect(appendCarriedTasks([],source,['first','second'],()=>crypto.randomUUID())).toHaveLength(2)
})

it('uses each unused matching target once for duplicate-key selections',()=>{
 const source=jobFixture({tasks:[taskFixture({id:'first',notes:'One'}),taskFixture({id:'second',notes:'Two'})]})
 const result=appendCarriedTasks([taskFixture({id:'target-one',specification:'Spec one'}),taskFixture({id:'target-two',specification:'Spec two'})],source,['first','second'],()=> 'unused')
 expect(result.map(task=>[task.id,task.specification,task.origin?.taskId])).toEqual([['target-one','Spec one','first'],['target-two','Spec two','second']])
})
