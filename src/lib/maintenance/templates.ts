import type { AccountContext } from '@/lib/account'
import type { BikeView } from '@/lib/garageBikes'
import type { Json } from '@/types/database.types'
import type { JobView, Template } from './types'
import { validateTemplate, verifiedTemplates, type ReviewedTemplate } from './templateValidation'
import cb1000r from '../../../data/maintenance-templates/honda-cb1000r-2008.json'
import cb650ra from '../../../data/maintenance-templates/honda-cb650ra-2023.json'
export const reviewedTemplates = [...cb1000r,...cb650ra] as ReviewedTemplate[]
export function templateFromJob(job:JobView,id:string,title:string):Template {
 return validateTemplate({id,version:1,title,kind:'custom',motorcycleId:null,years:[],markets:[],variants:[],intervalKm:null,intervalMonths:null,frequency:'on_demand',source:null,
  tasks:job.tasks.map((task,index)=>({key:task.key && job.tasks.filter(item=>item.key===task.key).length===1?task.key:`custom:${id}:${index+1}`,label:task.label,action:task.action,reference:task.reference,warning:task.warning,specification:task.specification,safety:null}))})
}
export async function listTemplates(account:AccountContext,bike:BikeView):Promise<Template[]> {
 const custom:Template[]=[]
 while(true) {
  const {data,error}=await account.client.from('maintenance_templates').select('definition').eq('owner_id',account.userId).order('id').range(custom.length,custom.length+999)
  if(error) throw new Error('Could not load personal templates')
  if(!data?.length) break
  custom.push(...data.map(row=>validateTemplate(row.definition)))
 }
 return [...verifiedTemplates(reviewedTemplates,bike),...custom]
}
export async function saveCustomTemplate(account:AccountContext,input:Template):Promise<Template> {
 const template=validateTemplate(input)
 if(template.kind!=='custom') throw new Error('Only personal templates can be saved')
 const {data,error}=await account.client.rpc('save_custom_template',{p_definition:JSON.parse(JSON.stringify(template)) as Json})
 if(error) throw new Error(error.code==='PT409'?'This template changed. Reload it before saving.':'Could not save personal template')
 if(!data) throw new Error('Could not save personal template')
 return validateTemplate(data.definition)
}
