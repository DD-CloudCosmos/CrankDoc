import type { JobView, TaskPatch, Template, JobTask } from './types'
import { parseJobDraft, parseTaskPatch, parseTemplate, requireJobId, timestamp } from './validation'

export function createTasks(template: Template, newId: () => string): JobTask[] {
  const parsed = parseTemplate(template)
  const tasks = parsed.tasks.map(task => ({...task,id:requireJobId(newId()),state:'todo' as const,
    reason:'',notes:'',doneAt:null,origin:null}))
  if (new Set(tasks.map(task => task.id.toLowerCase())).size !== tasks.length) throw new Error('Duplicate task identifier')
  return tasks
}
function closure(job: JobView, tasks: JobTask[], now: string): JobView {
  const allDone = tasks.length > 0 && tasks.every(task => task.state === 'done')
  const manual = job.closeReason === 'manual'
  const applicableDone = tasks.length > 0 && tasks.every(task => task.state === 'done' || task.state === 'not_applicable')
  return {...job,tasks,revision:job.revision+1,status:manual ? (applicableDone ? 'completed' : 'partial') : (allDone ? 'completed' : 'in_progress'),
    closeReason:manual ? 'manual' : allDone ? 'all_done' : null,
    closedAt:manual || allDone ? job.closedAt ?? now : null}
}
export function applyTaskPatch(job: JobView, taskId: string, patch: TaskPatch, now: string): JobView {
  const parsed = parseJobDraft(job)
  const id = requireJobId(taskId), changes = parseTaskPatch(patch), stamp = timestamp(now)
  if (!parsed.tasks.some(task => task.id.toLowerCase() === id.toLowerCase())) throw new Error('Unknown task')
  const tasks = parsed.tasks.map(task => {
    if (task.id.toLowerCase() !== id.toLowerCase()) return task
    const state = changes.state ?? task.state
    return {...task,...changes,doneAt:state === 'done' ? task.doneAt ?? stamp : null}
  })
  const validated = parseJobDraft({...parsed,tasks})
  return closure({...job,...parsed},validated.tasks,stamp)
}
export function completeJob(job: JobView, now: string): JobView {
  const parsed = parseJobDraft(job), stamp = timestamp(now)
  return closure({...job,...parsed,closeReason:'manual'},parsed.tasks,stamp)
}
