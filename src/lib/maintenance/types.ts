export type TaskState = 'todo' | 'done' | 'skipped' | 'not_applicable'
export type TaskAction = 'inspect' | 'clean' | 'adjust' | 'replace' | 'other'
export type JobStatus = 'in_progress' | 'completed' | 'partial'
export type CloseReason = 'all_done' | 'manual' | null
export type Origin = { jobId: string; taskId: string; previousNotes: string }
export type JobTask = {
  id: string; key: string | null; label: string; action: TaskAction;
  state: TaskState; reason: string; notes: string; doneAt: string | null;
  origin: Origin | null; reference: string | null; warning: string | null;
  specification: string | null; safety: 'green' | 'yellow' | 'red' | null;
}
export type TemplateTask = Pick<JobTask,
  'key' | 'label' | 'action' | 'reference' | 'warning' | 'specification' | 'safety'>
export type Template = {
  id: string; version: number; title: string;
  kind: 'scheduled' | 'time_based' | 'individual' | 'custom';
  motorcycleId: string | null; years: number[]; markets: string[];
  variants: string[]; intervalKm: number | null; intervalMonths: number | null;
  frequency: 'once' | 'recurring' | 'on_demand';
  source: string | null; tasks: TemplateTask[];
}
export type JobDraft = {
  id: string; bikeId: string; title: string; date: string; mileageKm: number;
  template: Template | null; tasks: JobTask[]; notes: string;
  parts: string; performer: string; costMinor: number | null; currency: string | null;
}
export type JobView = JobDraft & {
  revision: number; status: JobStatus; closeReason: CloseReason;
  closedAt: string | null; createdAt: string;
}
export type TaskPatch = Partial<Pick<JobTask, 'state' | 'reason' | 'notes'>>
export type SavedResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: 'invalid' | 'not_found' | 'conflict' | 'save_failed'; message: string; current?: T }
export type FileInput = {id:string;kind:'bike_photo'|'receipt';bikeId:string;jobId:string|null;path:string;filename:string}
export type PrivateFile = {id:string;bikeId:string;jobId:string|null;kind:'bike_photo'|'receipt';path:string;filename:string;cleanupPending:boolean;sourcePending?:boolean}
