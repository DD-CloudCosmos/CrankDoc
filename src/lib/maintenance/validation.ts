import type { JobDraft, JobTask, Template, TemplateTask } from './types'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function invalid(): never { throw new Error('Invalid maintenance record') }
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid()
  return value as Record<string, unknown>
}
function text(value: unknown, max: number, required = false): string {
  if (typeof value !== 'string' || [...value].length > max || (required && !value.trim())) invalid()
  return value
}
function nullableText(value: unknown, max = 4000): string | null { return value === null ? null : text(value, max) }
export function requireJobId(value: unknown): string {
  if (typeof value !== 'string' || !UUID.test(value)) invalid()
  return value
}
function choice<T extends string>(value: unknown, choices: readonly T[]): T {
  if (typeof value !== 'string' || !choices.includes(value as T)) invalid()
  return value as T
}
export function timestamp(value: unknown): string {
  const s = text(value, 40, true)
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/.test(s) || !Number.isFinite(Date.parse(s))) invalid()
  calendarDate(s.slice(0,10))
  return s
}
function calendarDate(value: unknown): string {
  const s = text(value, 10, true)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || s.startsWith('0000') || new Date(`${s}T00:00:00Z`).toISOString().slice(0,10) !== s) invalid()
  return s
}
function mileage(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value >= 1_000_000_000 || value !== Math.round(value * 1000) / 1000) invalid()
  return value
}
function cost(costMinor: unknown, currency: unknown): { costMinor: number | null; currency: string | null } {
  if (costMinor === null && currency === null) return {costMinor:null,currency:null}
  if (typeof costMinor !== 'number' || !Number.isSafeInteger(costMinor) || costMinor < 0) invalid()
  return {costMinor,currency:choice(currency,['EUR','GBP','USD'])}
}
export function parseCost(value: string, currency: string): { costMinor: number | null; currency: string | null } {
  if (value === '') return {costMinor:null,currency:null}
  if (!/^\d+(\.\d{1,2})?$/.test(value)) invalid()
  const [whole, fraction = ''] = value.split('.')
  return cost(Number(BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2,'0'))),currency)
}
function definition(input: unknown): TemplateTask {
  const v = object(input)
  return {key:nullableText(v.key,160),label:text(v.label,160,true),action:choice(v.action,['inspect','clean','adjust','replace','other']),
    reference:nullableText(v.reference),warning:nullableText(v.warning),specification:nullableText(v.specification),
    safety:v.safety === null ? null : choice(v.safety,['green','yellow','red'] as const)}
}
function task(input: unknown): JobTask {
  const v = object(input)
  const state = choice(v.state,['todo','done','skipped','not_applicable'])
  const reason = text(v.reason,500,state === 'skipped' || state === 'not_applicable')
  const doneAt = v.doneAt === null ? null : timestamp(v.doneAt)
  if ((state === 'done') !== (doneAt !== null)) invalid()
  const origin = v.origin === null ? null : object(v.origin)
  return {...definition(v),id:requireJobId(v.id),state,reason,notes:text(v.notes,4000),doneAt,
    origin:origin && {jobId:requireJobId(origin.jobId),taskId:requireJobId(origin.taskId),previousNotes:text(origin.previousNotes,4000)}}
}
function list<T>(value: unknown, parse: (input: unknown) => T): T[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 100) invalid()
  return value.map(parse)
}
function positive(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1 || value > 2147483647) invalid()
  return value
}
export function parseTemplate(input: unknown): Template {
  const v = object(input)
  if (!Array.isArray(v.years) || v.years.some(y => typeof y !== 'number' || !Number.isInteger(y) || y < 1885 || y > 9999)) invalid()
  const strings = (value: unknown) => {
    if (!Array.isArray(value)) invalid()
    return value.map(s => text(s,120,true))
  }
  return {id:text(v.id,160,true),version:positive(v.version),title:text(v.title,160,true),kind:choice(v.kind,['scheduled','time_based','individual','custom']),
    motorcycleId:v.motorcycleId === null ? null : requireJobId(v.motorcycleId),years:v.years as number[],markets:strings(v.markets),variants:strings(v.variants),
    intervalKm:v.intervalKm === null ? null : mileage(v.intervalKm),intervalMonths:v.intervalMonths === null ? null : positive(v.intervalMonths),
    frequency:choice(v.frequency,['once','recurring','on_demand']),source:nullableText(v.source),tasks:list(v.tasks,definition)}
}
export type JobDetails = Pick<JobDraft,'title'|'date'|'mileageKm'|'notes'|'parts'|'performer'|'costMinor'|'currency'>
export function parseJobDetails(input: unknown): JobDetails {
  const v = object(input)
  return {title:text(v.title,160,true),date:calendarDate(v.date),mileageKm:mileage(v.mileageKm),notes:text(v.notes,4000),parts:text(v.parts,4000),performer:text(v.performer,120),...cost(v.costMinor,v.currency)}
}
export function parseJobDraft(input: unknown): JobDraft {
  const v = object(input)
  const tasks = list(v.tasks,task)
  if (new Set(tasks.map(t => t.id.toLowerCase())).size !== tasks.length) invalid()
  return {...parseJobDetails(v),id:requireJobId(v.id),bikeId:requireJobId(v.bikeId),template:v.template === null ? null : parseTemplate(v.template),tasks}
}

export function parseTaskPatch(input: unknown): import('./types').TaskPatch {
  const v = object(input)
  if (Object.keys(v).some(k => !['state','reason','notes'].includes(k))) invalid()
  return {...('state' in v ? {state:choice(v.state,['todo','done','skipped','not_applicable'] as const)} : {}),
    ...('reason' in v ? {reason:text(v.reason,500)} : {}), ...('notes' in v ? {notes:text(v.notes,4000)} : {})}
}
