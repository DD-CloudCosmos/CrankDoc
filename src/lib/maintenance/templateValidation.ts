import type { BikeView } from '@/lib/garageBikes'
import type { Template } from './types'
import { parseTemplate } from './validation'
export type ReviewedTemplate = {verification:'draft'|'verified';reviewedSource:string;reviewNotes:string;template:Template}
export function validateTemplate(input:unknown):Template {
 const template=parseTemplate(input)
 const fail=()=>{throw new Error('Invalid template definition')}
 if(template.years.some(year=>year>2100) || template.tasks.some(task=>!task.key?.trim()) || new Set(template.tasks.map(task=>task.key)).size!==template.tasks.length) fail()
 if(template.kind==='custom') {
  if(template.motorcycleId!==null || template.years.length || template.markets.length || template.variants.length || template.frequency!=='on_demand' || template.intervalKm!==null || template.intervalMonths!==null || template.source!==null || template.tasks.some(task=>task.safety!==null)) fail()
 } else {
  if(!template.motorcycleId || !template.years.length || !template.markets.length || !template.variants.length || !template.source?.trim() || template.tasks.some(task=>!task.reference?.trim() || !task.warning?.trim())) fail()
  if(template.kind==='individual' && template.frequency!=='on_demand') fail()
  if(template.kind==='time_based' && (template.frequency!=='recurring' || template.intervalMonths===null)) fail()
  if(template.kind==='scheduled' && template.intervalKm===1000 && template.frequency!=='once') fail()
  if(template.kind==='scheduled' && (template.intervalKm===null || template.intervalKm<=0 || template.frequency==='on_demand')) fail()
 }
 return template
}
export function matchesCoverage(template:Template,bike:BikeView):boolean {
 if(template.kind==='custom') return true
 return template.motorcycleId===bike.motorcycleId && bike.year!==null && template.years.includes(bike.year) && Boolean(bike.market) && template.markets.includes(bike.market) && Boolean(bike.variant) && template.variants.includes(bike.variant)
}
export function verifiedTemplates(entries:ReviewedTemplate[],bike:BikeView):Template[] {
 return entries.filter(entry=>entry.verification==='verified').map(entry=>validateTemplate(entry.template)).filter(template=>matchesCoverage(template,bike))
}
/** Merge selected definitions by stable key, preserving action-specific rows. */
export function combineTemplates(templates:Template[]):Template {
 if(!templates.length) throw new Error('Choose a template')
 const tasks=templates.flatMap(template=>template.tasks).filter((task,index,all)=>all.findIndex(item=>item.key===task.key)===index).map(task=>({...task}))
 if(tasks.length>100) throw new Error('Choose at most 100 tasks')
 return {...templates[0],source:templates.map(template=>`${template.title} (version ${template.version})${template.source?`: ${template.source}`:''}`).join('\n').slice(0,4000),tasks}
}
