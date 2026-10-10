import { readFileSync } from 'node:fs'
import { validateTemplate } from '../src/lib/maintenance/templateValidation'
const ids=new Set<string>()
let count=0,verified=0
for(const filename of ['honda-cb1000r-2008.json','honda-cb650ra-2023.json']) {
 const entries=JSON.parse(readFileSync(`data/maintenance-templates/${filename}`,'utf8'))
 if(!Array.isArray(entries)||!entries.length)throw new Error('Missing source entries')
 for(const entry of entries) {
  if(!['draft','verified'].includes(entry.verification)||!entry.reviewedSource?.trim()||!entry.reviewNotes?.trim())throw new Error('Missing review metadata')
  const t=validateTemplate(entry.template)
  if(ids.has(t.id)||t.kind==='custom')throw new Error('Invalid static identity')
  ids.add(t.id);count++;if(entry.verification==='verified')verified++
  if(t.tasks.some(task=>task.specification!==null || !task.reference?.includes('p.') || !task.label.toLowerCase().startsWith(task.action==='other'?'lubricate':task.action)))throw new Error('Unreviewed specification, action or page reference')
  if(t.kind==='scheduled' && ((t.intervalKm===1000)!==(t.frequency==='once')))throw new Error('First service must be once')
 }
}
console.log(`${count} structured source entries valid; ${verified} verified, ${count-verified} draft. Mechanical accuracy requires independent source review.`)
