# My Garage Templates and Working Checklists Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Users start model-specific or custom maintenance checklists, save progress, carry over unfinished work and print a workshop sheet.

**Architecture:** Pure functions calculate task/closure changes; authenticated database functions apply them atomically with a revision check. Templates provide fresh task snapshots. A new activity can refer to earlier unfinished tasks without rewriting their original history.

**Tech Stack:** Existing React/TypeScript/Supabase stack, native checkbox/details controls, Tailwind print styles, Vitest and local database integration tests.

**Spec:** [Approved design](../specs/2026-10-10-my-garage-design.md), [umbrella plan](2026-10-10-my-garage.md). Requires both earlier stages.

## Global Constraints

- "The job remains In progress until every task is marked Done or the user explicitly selects Complete job."
- "Starting a new job alone never closes the old one."
- "Do not merge tasks solely because their names look similar."
- "Printing does not mark anything completed."
- "Do not invent missing procedure or specification details."
- "Offline synchronisation is outside the first version."
- Apply all shared contracts, limits and release boundaries from the umbrella plan. Source review and technical content validation do not resolve the parked legal review.

## Review Focus

- The final checkbox and job closure must save together; failed saves cannot claim completion.
- Two-device updates must return a conflict with the draft retained instead of discarding notes.
- Skipped and Not applicable are not Done; automatic completion requires every task to be Done.
- Carry-over must be same-bike, selected, linked to its source and safe on retries.
- Print output must show partial work and previous notes accurately, without changing any record.

## File map and interfaces

Create `src/lib/maintenance/checklist.ts`, `carryover.ts`, `templates.ts`, `templateValidation.ts`, and colocated tests. Extend jobsRepository.server.ts and types from stage 2. Create `src/app/garage/[bikeId]/TemplatePicker.tsx`, `Checklist.tsx`, `ChecklistRow.tsx`, `CarryOverPicker.tsx`, `CustomTemplateForm.tsx`, and tests. Create `src/hooks/useChecklist.ts`/test for save sequencing. Create job and print pages at `src/app/garage/[bikeId]/jobs/[jobId]/page.tsx` and `print/page.tsx`, plus `PrintChecklist.tsx`/test; extend garage actions and BikeWorkspace.

```ts
// checklist.ts
export function createTasks(template: Template, newId: () => string): JobTask[]
export function applyTaskPatch(job: JobView, taskId: string, patch: TaskPatch, now: string): JobView
export function completeJob(job: JobView, now: string): JobView
// carryover.ts
export type CarrySelection = { sourceJobId:string; sourceRevision:number; taskIds:string[]; closePrevious:boolean }
export function carryCandidates(previous: JobView | null): JobTask[]
export function appendCarriedTasks(tasks: JobTask[], previous: JobView,
  selectedIds: string[], newId: () => string): JobTask[]
// jobsRepository.server.ts
export function startJob(account: AccountContext, draft: JobDraft,
  carry: CarrySelection | null): Promise<SavedResult<JobView>>
export function saveTaskPatch(account: AccountContext, jobId:string, revision:number,
  taskId:string, patch:TaskPatch): Promise<SavedResult<JobView>>
export function closeJob(account: AccountContext, jobId:string, revision:number,
  date:string, mileageKm:number): Promise<SavedResult<JobView>>
// templates.ts
export function listTemplates(account: AccountContext, bike: BikeView): Promise<Template[]>
export function saveCustomTemplate(account: AccountContext, template: Template): Promise<Template>
export function templateFromJob(job: JobView, id:string, title:string): Template
// templateValidation.ts
export function validateTemplate(input: unknown): Template
export function matchesCoverage(template: Template, bike: BikeView): boolean
```

Templates with empty year/market/variant lists apply across that field only when their reviewed source confirms it. Otherwise explicit coverage is required and an unknown bike field prevents matching. A custom template has no verified model claim and can be used with an unlisted bike.

### Task 1: Checklist snapshots, states and atomic completion

**Files:** checklist.ts/test; new CLI-created `supabase/migrations/*_maintenance_checklists.sql`; jobsRepository.server.ts/test; extend scripts/test-garage-access.ts and database types.

**Interfaces:** Checklist/repository signatures above. Database `save_task_patch(p_job_id uuid,p_expected_revision integer,p_task_id uuid,p_patch jsonb)` and `close_maintenance_job(p_job_id uuid,p_expected_revision integer,p_date date,p_mileage numeric)` return the updated job. Add `start_maintenance_job(p_draft jsonb,p_carry jsonb)` in task 3.

- [x] Create test fixtures as complete typed JobView and JobTask values. Write failing tests for fresh IDs/no work notes, no mutation of source templates, all-Done closure, skipped/Not applicable remaining active, manual partial closure, unticking an automatically completed job, and notes retaining a manually closed job's closure.

```ts
const unfinished: JobView = {
  id:'job',bikeId:'bike',title:'Service',date:'2026-10-10',mileageKm:12000,template:null,
  tasks:[{id:'task',key:'chain:inspect',label:'Inspect chain',action:'inspect',state:'todo',
    reason:'',notes:'',doneAt:null,origin:null,reference:null,warning:null,specification:null,safety:null}],
  notes:'',parts:'',performer:'',costMinor:null,currency:null,revision:1,
  status:'in_progress',closeReason:null,closedAt:null,createdAt:'2026-10-10T10:00:00Z',
}
const finished = applyTaskPatch(unfinished,'task',{state:'done'},'2026-10-10T12:00:00Z')
expect(finished.status).toBe('completed')
expect(finished.closeReason).toBe('all_done')
expect(unfinished.tasks[0].state).toBe('todo')
expect(applyTaskPatch(finished,'task',{state:'todo'},'2026-10-10T12:01:00Z').status).toBe('in_progress')
```

- [x] Run checklist tests to confirm failure. Implement fresh snapshots by copying task definitions, generating new IDs and setting work fields to empty. Reject unknown task IDs, duplicate IDs, empty labels, invalid state strings, too many tasks and absent reasons for Skipped/Not applicable. A transition to Done sets doneAt once; a retry doesn't change it; a transition away clears it. Notes-only updates do not change doneAt.

```ts
// Core closure calculation after a validated immutable task update.
const allDone = tasks.length > 0 && tasks.every(task => task.state === 'done')
const applicableDone = tasks.every(task => task.state === 'done' ||
  (task.state === 'not_applicable' && task.reason.trim().length > 0))
const status: JobStatus = job.closeReason === 'manual'
  ? (applicableDone ? 'completed' : 'partial')
  : (allDone ? 'completed' : 'in_progress')
const closeReason: CloseReason = job.closeReason === 'manual' ? 'manual' : allDone ? 'all_done' : null
```

- [x] Implement database functions with security invoker, authenticated execution only, explicit owner filters and `FOR UPDATE` on the job. Validate expected revision before changing anything. Apply one task patch, recompute closure in the same transaction, increment revision once and return the row. Database validation must mirror the pure functions. Job dates/mileage remain the recorded work details; the closure timestamp is separate. Manual completion validates date/mileage and preserves unresolved tasks. Do not let an empty checklist complete vacuously.
- [x] Add real local tests for the last checkbox plus closure, repeated saved ID, invalid task state, explicit partial completion, unchecking/reopening, Not applicable reason, and foreign job IDs. Send two patches with the same revision concurrently: one succeeds and the other reports conflict; no note disappears. Use `Promise.all` only for this deliberate race test.
- [x] Run domain/database tests and project checks; commit `feat: save checklist progress and completion atomically`.

### Task 2: Tablet checklist, saved progress and failed-save recovery

**Files:** Checklist/ChecklistRow/job page/actions, useChecklist hook and tests from the file map.

**Interfaces:** `useChecklist(initial:JobView)` returns `{job:JobView;dirty:boolean;saving:boolean;error:string|null;setTask:(id:string,patch:TaskPatch)=>void;retry:()=>void;reload:()=>Promise<void>}`. `Checklist({initialJob}:{initialJob:JobView})`; `ChecklistRow({task,onChange}:{task:JobTask;onChange:(patch:TaskPatch)=>void})`.

- [x] Write failing component/hook tests for large checkboxes, per-line notes, visible essential warnings, expandable supporting reference, save indicator, save error/retry, reason-required row actions, partial-completion confirmation, and leaving/returning to an in-progress job. Use fake timers to test notes debounce; do not test only the implementation's internal state.

```tsx
import { jobFixture } from '@/test/garageFixtures'
const unfinished = jobFixture()
const user = userEvent.setup()
const save = vi.fn().mockResolvedValue({ok:false,error:'save_failed',message:'Could not save'})
vi.mocked(saveTaskPatchAction).mockImplementation(save)
render(<Checklist initialJob={unfinished} />)
await user.click(screen.getByRole('checkbox',{name:/Inspect chain/}))
expect(await screen.findByRole('alert')).toHaveTextContent('Could not save')
expect(screen.getByRole('button',{name:'Retry save'})).toBeEnabled()
expect(screen.queryByText('Job completed')).not.toBeInTheDocument()
```

Export `saveTaskPatchAction(jobId:string,revision:number,taskId:string,patch:TaskPatch):Promise<SavedResult<JobView>>` from the route's actions module; it calls getAccount then saveTaskPatch. Mock that action in the component test, not the server repository module. Add a notes test that types while one save is in flight and verifies the latest text is retained and sent next.

- [x] Run the hook/component tests to confirm failure. Implement a per-job save queue. Debounce text changes by 500 ms; checkbox/state changes flush queued notes. Keep one write in flight, use the returned revision for the next, and retain dirty changes until acknowledged. A network failure leaves the draft visible in memory; Retry uses the same patch/request identity. Do not persist private drafts in public localStorage or the service-worker cache.
- [x] On conflict show "This job changed on another device" with Reload saved version and the retained unsaved text available to copy. Do not automatically overwrite newer server notes. On session expiry prompt sign-in while retaining the form. Warn before leaving with unsaved work; there is no promise of offline synchronisation.
- [x] In the bike's Maintenance tab put Jobs in progress above completed history. The job page shows title, bike, recorded mileage, progress and task rows. Count only Done tasks as done; show Skipped and Not applicable labels separately. Use the existing SafetyBadge vocabulary for reviewed tasks. Custom tasks have no invented safety rating; label missing guidance as unassessed. Finish with outstanding work opens the explicit completion summary. A successful all-Done save shows the new history record and its editable date/mileage.
- [x] Ensure lesson completion/diagnostic flows do not write job states. Run hook/component and project tests; commit `feat: add resumable workshop checklists with per-task notes`.

### Task 3: Selected carry-over and explicit closure of the previous activity

**Files:** carryover.ts/test, CarryOverPicker/test, QuickJobForm/test, jobsRepository/actions/tests, checklist migration function and local access script.

**Interfaces:** CarrySelection, carryCandidates, appendCarriedTasks and startJob above. `CarryOverPicker({previous,onChange}:{previous:JobView|null;onChange:(choice:CarrySelection|null)=>void})`. Database start_maintenance_job takes the draft ID plus optional source job/revision, selected task IDs and closePrevious flag.

- [x] Write failing pure tests using full copies of the task-1 fixture. Cover selected To do/Skipped candidates, Done/Not applicable exclusion, same stable key merging, similar labels with different keys remaining separate, origin links and unchanged source notes/states.

```ts
import { jobFixture, taskFixture } from '@/test/garageFixtures'
const unfinished = jobFixture({id:'job',tasks:[{...taskFixture(),id:'task'}]})
const source = { ...unfinished, tasks:[{...unfinished.tasks[0],notes:'Noise noted at previous visit'}] }
const target = [{...unfinished.tasks[0],id:'new-task',notes:''}]
const merged = appendCarriedTasks(target,source,['task'],()=> 'another-new-task')
expect(merged).toHaveLength(1)
expect(merged[0].origin).toEqual({jobId:'job',taskId:'task',previousNotes:'Noise noted at previous visit'})
expect(merged[0].notes).toBe('')
expect(source.tasks[0].state).toBe('todo')
```

- [x] Run tests to confirm failure. Implement candidate filtering and merging by non-null stable task key only. A target task keeps its new definition/specification; the origin and previous notes attach separately. A custom source with no key is copied as a fresh row. Copied rows start To do with empty current notes/completion time. HTML-looking previous notes render as plain text.
- [x] Implement the start transaction: lock the owned bike; validate the source is that bike's latest existing activity and its revision matches; select source task content from the database; copy only selected eligible tasks; reject more than 100 total rows; insert the new job using its stable draft ID. If closePrevious is true and the source is still active, close it manually and increment its revision in the same transaction. If the source is already closed, require closePrevious=false. No caller-supplied source notes or owner IDs are trusted. If a draft ID already exists for the same owner/bike, return it rather than closing a source again.
- [x] Add local integration tests for the transaction failing before insert, failing during source closure, source revision changes, another bike/account, duplicate retry, selected-task count and a previously closed source. Assert failed operations leave both records unchanged. Complete a carried task in the new job and assert the original task remains pending with its original notes/date/mileage. The source history UI discovers its carry-over destination by origin links in that bike's jobs.
- [x] Implement the collapsed carry-over offer when creating an activity, including a quick entry. Default every task choice and Complete previous activity to unselected. Hide the offer when there are no candidates. If the source is closed, permit carrying unfinished work but hide the closure option. A quick entry with a carry-over/previous-closure choice uses startJob so all writes are one transaction; its performed tasks begin Done and the carried tasks begin To do. Without those choices, the quick-entry flow remains unchanged. Store nothing until the user submits; cancelling changes neither job. Run unit/component/database tests and project checks; commit `feat: carry selected unfinished work into the next activity`.

### Task 4: Custom templates and verified model-specific service choices

**Files:** TemplatePicker/CustomTemplateForm/tests, templates.ts/templateValidation.ts/tests; new CLI-created `supabase/migrations/*_maintenance_templates.sql`; generated types; create `data/maintenance-templates/honda-cb1000r-2008.json`, `honda-cb650ra-2023.json`, `scripts/validate-maintenance-templates.ts` and `Docs/maintenance-template-coverage.md`.

**Interfaces:** Template functions above. Custom table fields are `id uuid`, `owner_id uuid`, `version integer`, `title text`, `definition jsonb`, `created_at`, `updated_at`; owner policy/grants match other private tables. Static reviewed model files are served through templates.ts, never through user-written templates. Each static entry is `{verification:'draft'|'verified', reviewedSource:string, reviewNotes:string, template:Template}`. Only verified entries are listed.

- [x] Write failing coverage/validation tests for exact model/year/market/variant matches, unknown variant, custom templates, empty tasks, duplicate/null keys, first-service versus recurring choices, unsupported specification values, and a template update not mutating an existing job. Set draft entries unavailable even when their filename/model looks correct.

```ts
import { templateFixture, bikeFixture } from '@/test/garageFixtures'
const template = templateFixture()
const bike = bikeFixture()
const verified = { ...template, motorcycleId:'model',years:[2023],markets:['Europe'],variants:['ABS'] }
expect(matchesCoverage(verified,{...bike,motorcycleId:'model',year:2023,market:'Europe',variant:'ABS'})).toBe(true)
expect(matchesCoverage(verified,{...bike,motorcycleId:'model',year:2023,market:'Europe',variant:''})).toBe(false)
```

These are coverage tests using synthetic fixture content, not a mechanical source review. Do not use empty coverage arrays to evade unknown-variant checks.

- [x] Run template tests to confirm failure. Implement validateTemplate with the umbrella limits; version >=1, nonempty task list, explicit kinds/units/frequency and source coverage. Label the first service as frequency once, recurring service choices as recurring, and individual/custom work as on_demand; never present the first service as a repeating distance interval. Save custom templates with stable keys, increment version on edit, and use fresh task snapshots for each start. templateFromJob copies only task definitions; it removes states, reasons, completion dates, work notes, origins, costs and receipts. Private custom templates from account A are unavailable to B.
- [x] Author model templates only after reading the actual source pages. For CB1000R use the uploaded April 2008 factory manual in `public/manuals/honda-cb1000r-2008.pdf`, maintenance page 3-4, and check variant-specific procedures. For CB650RA use the 2023 European owner manual already audited at `/Users/david/Documents/Codex/2026-10-03/referenced-chatgpt-conversation-this-is-an/work/cb650r/manual.pdf`, pages 69–70. The 2021–22 workshop manual is not proof of 2023 procedure/specification coverage. Apply the PDF skill when inspecting these files.
- [x] Map each actual service column and marked action explicitly; preserve first-service, inspection/replacement and time-based conditions. Stable keys include model/task/action, so an inspection never merges with a replacement. Cite source pages per row and include the applicable safety guidance. Leave missing workshop values null and explain the gap. No interval modulo generator, no invented 10,000 km service, and no reproducing manual pages in template content.
- [x] Record the line-by-line source review in maintenance-template-coverage.md. The validator checks coverage, action labels, references, keys, version, required warnings and verification flags; it does not certify mechanical facts. Keep unverifiable entries draft. Compare both original schedule pages with the proposed checklists before enabling entries. A content reviewer must confirm the exact included tasks and omitted conditional work before release; the parked rights question remains separate.
- [x] Implement a small bike-scoped picker grouped by Scheduled service, Time-based work, Individual tasks and My templates. Offer only supported/confirmed coverage. Allow user-selected time-based additions with their source explanation, explicitly stating unknown due status when history is missing. Include those task definitions/references in the saved snapshot. The interface must not suggest a valve adjustment procedure or clearance when its source is absent.
- [x] Implement Save as template from a logged job and editing a user's templates. A pack is not required for custom templates. Run validator, private-template database tests, component tests and project checks; commit `feat: add reviewed maintenance templates and personal checklists`.

### Task 5: Workshop print sheet and final branch verification

**Files:** print page, PrintChecklist/test and an on-demand Print action on Checklist; modify `src/app/globals.css`/Navigation only for scoped print behaviour. Add a browser-test specification to `Docs/garage-acceptance.md` rather than running unauthorised browser automation.

**Interfaces:** `PrintChecklist({bike,job}:{bike:BikeView;job:JobView})`. The private print route validates both bike and job ownership and that the job belongs to the requested bike. Its print button calls `window.print()` only on the user's click. Printing is read-only.

- [x] Write failing component/API tests for all four task states, notes, Previous activity notes, template version/source, date/mileage fields, empty note space, long lines, warnings and a foreign bike/job combination. Test that clicking Print never invokes a write action.

```tsx
import { bikeFixture, jobFixture } from '@/test/garageFixtures'
const bike = bikeFixture()
const unfinished = jobFixture()
render(<PrintChecklist bike={bike} job={{...unfinished,tasks:[{
  ...unfinished.tasks[0],notes:'Inspect again after parts arrive',state:'skipped',reason:'Parts unavailable',
}]}} />)
expect(screen.getByText('Skipped')).toBeInTheDocument()
expect(screen.getByText('Parts unavailable')).toBeInTheDocument()
expect(screen.getByText('Inspect again after parts arrive')).toBeInTheDocument()
```

Use the complete fixtures from task 1 and the shared BikeView fixture; do not infer Done from a nonempty note.

- [x] Run tests to confirm failure. Implement a clean paper header with bike identity, service title/version/source and date/mileage. Print checkboxes/state labels, warnings and notes under each task. An unstarted job has blank boxes and writing space; a filled sheet preserves partial work. Avoid splitting a short task and notes across pages; allow very long notes to wrap across pages without clipping.
- [x] Use a scoped print stylesheet with page size auto, 12 mm margins and semantic print background/foreground tokens. Hide navigation/actions/upload controls in print only. Preserve text and state labels in monochrome; no colour-dependent meanings. Keep the interactive tablet page unchanged.
- [ ] Once browser automation is authorised, verify the complete flow with two local accounts and capture 320 px, 768 px and desktop screens in both themes. Exercise account recovery, duplicate models, photo restore, optional receipts, partial completion, selected carry-over, failed-save retry and reload. Render the print route to A4 and Letter PDF in the browser and inspect every page. Until then, mark those visual/print checks outstanding in garage-acceptance.md.
- [ ] Run validator, local ownership/storage/race tests and all project checks. Obtain a fresh whole-branch review and the required security review. Fix concrete issues before claiming completion. Commit `feat: print maintenance checklists and verify My Garage workflows`. Prepare the release summary and ask David for the separate live release decision with the exact migrations and hosted settings listed.

Task 5 automated implementation gates are recorded in [garage-acceptance.md](../../garage-acceptance.md). Validator, all local suites, tests, coverage, type checking, lint and isolated build passed. The mixed final checkbox stays open for controller reviews and the separate live release decision. Browser and paper checks remain unauthorized and unchecked.
