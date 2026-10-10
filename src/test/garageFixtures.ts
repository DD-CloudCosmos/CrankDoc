import type { BikeView } from '@/lib/garageBikes'
export function bikeFixture(overrides: Partial<BikeView> = {}): BikeView {
  return {id:'00000000-0000-4000-8000-000000000001',motorcycleId:null,
    nickname:'Weekend bike',make:'Honda',model:'Custom',year:null,variant:'',market:'',
    registration:'',mileageKm:null,archivedAt:null,photoPath:null,libraryImageUrl:null,
    modelReferenceUrl:null,...overrides}
}

import type { JobTask, JobView, Template } from '@/lib/maintenance/types'
export function taskFixture(overrides: Partial<JobTask> = {}): JobTask {
  return {id:'00000000-0000-4000-8000-000000000002',key:'chain:inspect',label:'Inspect chain',
    action:'inspect',state:'todo',reason:'',notes:'',doneAt:null,origin:null,
    reference:null,warning:null,specification:null,safety:null,...overrides}
}
export function jobFixture(overrides: Partial<JobView> = {}): JobView {
  return {id:'00000000-0000-4000-8000-000000000003',bikeId:bikeFixture().id,
    title:'Service',date:'2026-10-10',mileageKm:12000,template:null,tasks:[taskFixture()],
    notes:'',parts:'',performer:'',costMinor:null,currency:null,revision:1,
    status:'in_progress',closeReason:null,closedAt:null,createdAt:'2026-10-10T10:00:00Z',...overrides}
}
export function templateFixture(overrides: Partial<Template> = {}): Template {
  const task = taskFixture()
  return {id:'test-template',version:1,title:'Test service',kind:'individual',
    motorcycleId:null,years:[],markets:[],variants:[],intervalKm:null,intervalMonths:null,
    frequency:'on_demand',source:'Test fixture, not mechanical guidance',
    tasks:[{key:task.key,label:task.label,action:task.action,reference:task.reference,
      warning:task.warning,specification:task.specification,safety:task.safety}],...overrides}
}
