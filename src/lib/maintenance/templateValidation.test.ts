import { describe, expect, it } from 'vitest'
import { bikeFixture, templateFixture, jobFixture, taskFixture } from '@/test/garageFixtures'
import { matchesCoverage, validateTemplate, verifiedTemplates } from './templateValidation'
import { templateFromJob } from './templates'
import { createTasks } from './checklist'
const model='b4660699-fb60-4f70-b5c0-2023cb650a00'
const covered=()=>templateFixture({motorcycleId:model,years:[2023],markets:['Europe'],variants:['CB650RA'],tasks:[{...templateFixture().tasks[0],reference:'Honda 2023 p.69',warning:'Workshop procedure not assessed'}]})
describe('template definitions',()=>{
 it('requires exact known coverage',()=>{const template=covered();const bike=bikeFixture({motorcycleId:model,year:2023,market:'Europe',variant:'CB650RA'});expect(matchesCoverage(template,bike)).toBe(true);for(const change of [{year:null},{year:2022},{market:''},{market:'US'},{variant:''},{variant:'ABS'},{motorcycleId:null}])expect(matchesCoverage(template,{...bike,...change})).toBe(false)})
 it('does not treat empty source coverage as universal',()=>{expect(()=>validateTemplate({...covered(),variants:[]})).toThrow()})
 it('keeps draft entries hidden',()=>{const entry={verification:'draft' as const,reviewedSource:'Honda',reviewNotes:'Pending review',template:covered()};const bike=bikeFixture({motorcycleId:model,year:2023,market:'Europe',variant:'CB650RA'});expect(verifiedTemplates([{...entry,verification:'verified'}],bike)).toHaveLength(1);expect(verifiedTemplates([entry],bike)).toEqual([])})
 it('accepts custom work for unlisted bikes',()=>{const custom=templateFixture({kind:'custom',source:null});expect(matchesCoverage(custom,bikeFixture())).toBe(true);expect(validateTemplate(custom)).toEqual(custom)})
 it('rejects empty tasks, missing or duplicate keys, bad versions and unsupported specification types',()=>{const t=covered();for(const change of [{tasks:[]},{tasks:[{...t.tasks[0],key:null}]},{tasks:[t.tasks[0],t.tasks[0]]},{version:0},{years:[2101]},{tasks:[{...t.tasks[0],specification:3}]}])expect(()=>validateTemplate({...t,...change})).toThrow()})
 it('keeps first service once, recurring scheduled work recurring, and custom work on demand',()=>{expect(validateTemplate({...covered(),kind:'scheduled',intervalKm:1000,frequency:'once'}).frequency).toBe('once');expect(validateTemplate({...covered(),kind:'scheduled',intervalKm:12000,frequency:'recurring'}).frequency).toBe('recurring');expect(()=>validateTemplate({...covered(),kind:'custom',frequency:'recurring'})).toThrow()})
 it('copies only definitions and assigns stable custom keys for null job keys',()=>{const job=jobFixture({tasks:[taskFixture({key:null,state:'done',doneAt:'2026-10-10T10:00:00Z',notes:'private',reason:'reason',origin:{jobId:jobFixture().id,taskId:taskFixture().id,previousNotes:'old'}})]});const t=templateFromJob(job,'00000000-0000-4000-8000-000000000009','Reusable');expect(t.tasks[0]).not.toHaveProperty('notes');expect(t.tasks[0]).not.toHaveProperty('state');expect(t.tasks[0]).not.toHaveProperty('origin');expect(t.tasks[0].key).toBeTruthy();expect(t).not.toHaveProperty('costMinor');expect(validateTemplate(t)).toEqual(t)})
 it('keeps started job snapshots independent of later edits',()=>{const t=covered();const tasks=createTasks(t,()=>crypto.randomUUID());t.tasks[0].label='Changed';expect(tasks[0].label).toBe('Inspect chain');expect(tasks[0].state).toBe('todo');expect(tasks[0].notes).toBe('')})
})

import { reviewedTemplates } from './templates'
it('preserves source-specific filter, air cleaner, valve and first-service choices',()=>{
 const get=(id:string)=>reviewedTemplates.find(e=>e.template.id===id)!.template
 const keys=(id:string)=>get(id).tasks.map(t=>t.key)
 expect(get('cb1000r-1000').frequency).toBe('once')
 expect(keys('cb1000r-18000')).toContain('cb1000r:air-cleaner:inspect')
 expect(keys('cb1000r-18000')).not.toContain('cb1000r:engine-oil:replace')
 expect(keys('cb650ra-12000')).not.toContain('cb650ra:engine-oil-filter:replace')
 expect(keys('cb650ra-24000')).toContain('cb650ra:air-cleaner:replace')
 expect(keys('cb650ra-36000')).toContain('cb650ra:valve-clearance:inspect')
 expect(keys('cb650ra-24000')).not.toContain('cb650ra:evaporative-emission-control-system:inspect')
 expect(get('cb650ra-evap').variants).not.toContain('CB650RA')
 for(const entry of reviewedTemplates) {expect(()=>validateTemplate(entry.template)).not.toThrow();expect(entry.template.tasks.every(t=>t.specification===null)).toBe(true)}
 for(const id of ['cb1000r-1000','cb650ra-1000']) {expect(keys(id)).toContain(`${id.split('-')[0]}:drive-chain:inspect`);expect(keys(id)).toContain(`${id.split('-')[0]}:drive-chain:other`)}
})
import { rekeyChangedTasks, combineTemplates } from './templateValidation'
it('keeps unchanged keys and changes identity for changed task meaning',()=>{
 const original=templateFixture().tasks
 for(const patch of [{action:'replace' as const},{label:'Different work'},{specification:'Changed specification'},{reference:'Different procedure'}]){
  const edited=rekeyChangedTasks(original,[{...original[0],...patch}],()=> 'custom:new:task')
  expect(edited[0].key).toBe('custom:new:task');expect(combineTemplates([templateFixture(),templateFixture({tasks:edited})]).tasks).toHaveLength(2)
 }
 expect(rekeyChangedTasks(original,original,()=> 'unused')[0].key).toBe(original[0].key)
})
