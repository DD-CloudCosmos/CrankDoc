import {expect,it} from 'vitest'
import {bikeFixture,jobFixture,taskFixture,templateFixture} from '@/test/garageFixtures'
import {exportBikeCsv,exportBikeJson} from './export'
it('projects only recorded facts, excluding unexpected properties at every level and other bike jobs',()=>{
 const task=taskFixture({doneAt:'2026-10-09T12:00:00Z',origin:{jobId:'old',taskId:'old-task',previousNotes:'prior'}})
 const template=templateFixture()
 const job=jobFixture({tasks:[Object.assign(task,{access_token:'secret'})],template:Object.assign(template,{signedUrl:'temporary'}),costMinor:0,currency:'EUR'})
 const bike=Object.assign(bikeFixture(),{owner_id:'secret',access_token:'secret'})
 const file={id:'receipt',jobId:job.id,kind:'receipt' as const,filename:'résumé.pdf',path:'secret',signedUrl:'temporary'}
 const text=exportBikeJson(bike,[Object.assign(job,{owner_id:'secret'}),jobFixture({bikeId:'foreign'})],[file])
 const data=JSON.parse(text)
 expect(data.jobs).toHaveLength(1);expect(data.jobs[0]).toMatchObject({date:'2026-10-10',costMinor:0,template:{version:1},tasks:[{doneAt:task.doneAt,origin:task.origin}]})
 expect(data.files).toEqual([{id:'receipt',jobId:job.id,kind:'receipt',filename:'résumé.pdf'}])
 for(const forbidden of ['access_token','owner_id','signedUrl','photoPath','libraryImageUrl','secret','temporary']) expect(text).not.toContain(forbidden)
 expect(exportBikeJson(bike,[job],[file])).toBe(exportBikeJson(bike,[job],[file]))
})
it('quotes every CSV field, preserves facts and neutralises all formula prefixes without changing notes',()=>{
 const bike=bikeFixture({nickname:'Été, "bike"'})
 const notes='  =HYPERLINK("https://other.example")\n<script>text</script>'
 const job=jobFixture({notes,costMinor:0,currency:'EUR',mileageKm:0,tasks:[taskFixture({notes:'+SUM(1,2)',origin:{jobId:'old',taskId:'task',previousNotes:'@prior'}}),taskFixture({id:'two',notes:'-value'}),taskFixture({id:'three',notes:'\t@value'})]})
 const text=exportBikeCsv(bike,[job,jobFixture({bikeId:'foreign',title:'foreign'})])
 expect(text).toContain('"Été, ""bike"""');expect(text).toContain('"\'  =HYPERLINK(""https://other.example"")\n<script>text</script>"')
 for(const value of ["'+SUM(1,2)","'@prior","'-value","'\t@value"]) expect(text).toContain(value)
 expect(text).toContain('"2026-10-10","0"');expect(text).toContain('"0","EUR"');expect(text).not.toContain('foreign');expect(job.notes).toBe(notes)
 expect(exportBikeCsv(bike,[]).split('\r\n')).toHaveLength(1)
})
