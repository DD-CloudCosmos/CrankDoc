# My Garage Maintenance History and Private Files Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Each bike has a searchable maintenance history, simple entries, an optional personal photograph and private receipts, with export available to its owner.

**Architecture:** A maintenance job belongs to a physical bike and stores a checklist snapshot. Owner-scoped database transactions create/edit jobs and update mileage. Pending source files upload directly to private Storage with the owner client. After owner checks and byte validation, a narrow server-only writer stores immutable final bytes and attaches metadata. Durable file states block uploads and finalisation after removal starts.

**Tech Stack:** Existing Next.js/Supabase stack, explicit `sharp@0.35.5` dependency, Vitest, React Testing Library and real local Storage tests.

**Spec:** [Approved design](../specs/2026-10-10-my-garage-design.md), [umbrella plan](2026-10-10-my-garage.md). Requires the completed [account stage](2026-10-10-my-garage-accounts.md).

## Global Constraints

- "Costs and receipts are optional."
- "Saving a historical job must not lower the bike's latest mileage."
- "Receipt links must not be public."
- "Keep the existing image until the replacement is successfully saved."
- "Personal records belong to the account and can be exported without requiring an active model pack."
- Apply all limits, contracts and release boundaries from the umbrella plan. No college sharing, paid-pack enforcement or offline writes.

## Review Focus

- Blank costs, zero cost and different currencies must remain distinct; there is no mixed-currency total.
- A failed receipt or image upload must not erase the saved job or previous image.
- Long notes and HTML-like content must render as text and remain searchable.
- Historical mileage and unit conversion must preserve the bike's latest reading.
- Export files must preserve original dates/states and neutralise spreadsheet formula cells.

## File map and contracts

Create `src/lib/maintenance/types.ts` with the exact contracts in the umbrella plan; `validation.ts`, `distance.ts`, `jobsRepository.server.ts`, `export.ts`, `uploads.server.ts`, and colocated tests. Create `src/app/garage/[bikeId]/QuickJobForm.tsx`, `MaintenanceHistory.tsx`, `MaintenanceRecord.tsx`, `BikePhotoEditor.tsx`, `ReceiptUpload.tsx`, and colocated tests. Extend `BikeWorkspace.tsx` and garage actions.

Create authenticated API endpoints and their tests at `src/app/api/garage/files/route.ts` and `src/app/api/garage/export/route.ts`. `POST /api/garage/files` finalises an uploaded file; `GET` returns a short-lived download URL after an ownership check; `DELETE` removes an owned attachment or restores a bike's default image. `GET /api/garage/export?bikeId=...&format=json|csv` streams private account data as a download.

```ts
export function parseJobDraft(input: unknown): JobDraft
export function toKilometres(value: number, unit: 'km' | 'miles'): number
export function parseCost(value: string, currency: string): { costMinor: number | null; currency: string | null }
export function listJobs(account: AccountContext, bikeId: string): Promise<JobView[]>
export function getJob(account: AccountContext, jobId: string): Promise<JobView | null>
export function createQuickJob(account: AccountContext, draft: JobDraft): Promise<SavedResult<JobView>>
export function editJobDetails(account: AccountContext, jobId: string,
  revision: number, input: Pick<JobDraft,'title'|'date'|'mileageKm'|'notes'|'parts'|'performer'|'costMinor'|'currency'>
): Promise<SavedResult<JobView>>
export function deleteJob(account: AccountContext, jobId: string): Promise<SavedResult<null>>
export type FileInput = { id:string; kind:'bike_photo'|'receipt'; bikeId:string;
  jobId:string|null; path:string; filename:string }
export function finaliseFile(account: AccountContext, input: FileInput): Promise<SavedResult<{id:string;path:string}>>
export function getPrivateFileUrl(account: AccountContext, fileId: string): Promise<string | null>
export function removePrivateFile(account: AccountContext, fileId: string): Promise<SavedResult<null>>
export function exportBikeJson(bike: BikeView, jobs: JobView[], files: ExportFile[]): string
export function exportBikeCsv(bike: BikeView, jobs: JobView[]): string
export type ExportFile = {id:string;jobId:string|null;kind:'bike_photo'|'receipt';filename:string}
```

All names are implemented in the files above. API input never accepts an owner ID. Unknown/foreign bikes, jobs and files return the same not-found response. Protected routes use `getAccount()` and `Cache-Control: private, no-store`; signed-out API calls return 401, not an HTML redirect.

### Task 1: Validated quick entries and atomic mileage updates

**Files:** Domain/types/distance/validation/repository files above; new CLI-created `supabase/migrations/*_maintenance_jobs.sql`; generated database types; extend `scripts/test-garage-access.ts` and `src/test/garageFixtures.ts`.

**Interfaces:** Domain signatures above. Database `create_quick_job(p_draft jsonb)` returns the stored job; `edit_job_details(p_job_id uuid,p_expected_revision integer,p_details jsonb)` returns it after incrementing its revision. Both are security-invoker functions operating under the caller's owner policies.

- [x] Write failing parsing/cost/distance tests with complete inputs. Cost parsing permits blank and zero, rejects negatives, exponent syntax and more than two decimal places for EUR/GBP/USD, and returns integer minor units. Keep calendar dates as `YYYY-MM-DD`; reject impossible dates.

```ts
expect(parseCost('', 'EUR')).toEqual({costMinor:null,currency:null})
expect(parseCost('0', 'EUR')).toEqual({costMinor:0,currency:'EUR'})
expect(parseCost('42.50', 'EUR')).toEqual({costMinor:4250,currency:'EUR'})
expect(() => parseCost('-1', 'EUR')).toThrow()
expect(toKilometres(1000, 'miles')).toBe(1609.344)
```

- [x] Run `npx vitest run src/lib/maintenance/validation.test.ts src/lib/maintenance/distance.test.ts` and confirm failure. Extend the shared test fixture module with these factories, then create the migration with the CLI. Add maintenance_jobs with the fields and constraints below:

```ts
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
```

```sql
create table public.maintenance_jobs (
  id uuid primary key, owner_id uuid not null references auth.users(id) on delete cascade,
  bike_id uuid not null, title text not null, job_date date not null,
  mileage_km numeric(12,3) not null check(mileage_km >= 0),
  tasks jsonb not null check(jsonb_typeof(tasks)='array' and jsonb_array_length(tasks) between 1 and 100),
  template_id text, template_version integer, template_snapshot jsonb,
  notes text not null default '', parts text not null default '', performer text not null default '',
  cost_minor bigint check(cost_minor >= 0), currency text,
  status text not null check(status in ('in_progress','completed','partial')),
  close_reason text check(close_reason in ('all_done','manual')),
  closed_at timestamptz, revision integer not null default 1 check(revision >= 1),
  created_at timestamptz not null default now(), unique(owner_id,id),
  foreign key(owner_id,bike_id) references public.garage_bikes(owner_id,id) on delete cascade,
  check(length(title) between 1 and 160), check(length(notes)<=4000 and length(parts)<=4000),
  check(length(performer)<=120),
  check((cost_minor is null and currency is null) or
    (cost_minor is not null and currency is not null and currency in ('EUR','GBP','USD'))),
  check((status='in_progress' and closed_at is null and close_reason is null) or
    (status in ('completed','partial') and closed_at is not null and close_reason is not null))
);
alter table public.maintenance_jobs enable row level security;
grant select,insert,update,delete on public.maintenance_jobs to authenticated;
create policy maintenance_jobs_owner on public.maintenance_jobs for all to authenticated
  using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create index maintenance_jobs_bike_date on public.maintenance_jobs(owner_id,bike_id,job_date desc,created_at desc);
```

- [x] Implement a quick entry as one or more explicitly Done tasks, with fresh task IDs and no template or origin. Validate every task label/state/action/notes/ID in TypeScript and again inside callable database functions before writing. The create function checks the owned bike, refuses an archived bike, locks that bike row, inserts the job once using its supplied stable ID, then updates mileage using `greatest(coalesce(mileage_km,0), new_mileage)`. A retry returns the existing same-owner, same-bike job; a mismatched reused ID is rejected. Revoke default public function execution and grant it only to authenticated callers. Do not add security-definer privileges to bypass policies.

```sql
-- Inside the same transaction, after the owned bike has been locked and the job inserted:
update public.garage_bikes
set mileage_km = greatest(coalesce(mileage_km,0), (p_draft->>'mileageKm')::numeric)
where id=(p_draft->>'bikeId')::uuid and owner_id=(select auth.uid());
```

- [x] Implement edit with row lock, expected-revision check, validation and one revision increment. A conflict returns the current record for the UI to reload; it must not overwrite the submitted form silently. Editing a historical entry never lowers latest bike mileage; deleting a job also does not infer a lower odometer reading. Delete requires an explicit user action.
- [x] Extend real database tests for atomic create/mileage, retrying the same ID, zero mileage, old job dates, cross-owner bike linkage and a stale revision. Add a race test where two quick jobs update mileage; the highest reading wins. Verify malformed task JSON cannot be persisted through these callable functions.
- [x] Run domain/repository tests, real local access tests and project checks. Commit `feat: add private maintenance jobs and reliable mileage updates`.

### Task 2: Simple forms, history, search and explicit corrections

**Files:** QuickJobForm, MaintenanceHistory, MaintenanceRecord, BikeWorkspace and garage actions/tests from the file map.

**Interfaces:** `QuickJobForm({bike,onSave}: {bike:BikeView;onSave:(draft:JobDraft)=>Promise<SavedResult<JobView>>})`; `MaintenanceHistory({jobs,onEdit,onDelete})` with callbacks matching `editJobDetails` and `deleteJob`; `MaintenanceRecord({job}:{job:JobView})`.

- [x] Write failing tests using an inline complete `JobView` fixture. Cover date/mileage/work required; optional notes/parts/performer/cost hidden until expanded; save failure retains values; double-submit disabled; editing a record is explicit; and search matches title, task labels and notes.

```tsx
import { bikeFixture } from '@/test/garageFixtures'
const bike = bikeFixture()
const user = userEvent.setup()
const save = vi.fn(async (draft: JobDraft): Promise<SavedResult<JobView>> => ({
  ok:true,value:{...draft,revision:1,status:'completed',closeReason:'all_done',
    closedAt:'2026-10-10T12:00:00Z',createdAt:'2026-10-10T12:00:00Z'},
}))
render(<QuickJobForm bike={bike} onSave={save} />)
await user.type(screen.getByLabelText(/Work performed/),'Engine oil changed')
await user.type(screen.getByLabelText(/Mileage/),'12000')
await user.click(screen.getByRole('button',{name:'Save entry'}))
expect(save.mock.calls[0][0].costMinor).toBeNull()
expect(save.mock.calls[0][0].tasks[0].state).toBe('done')
```

Use fake time to control the default calendar date. Test negative, infinite and too-precise costs before reaching the server; parseCost must produce a safe integer number of minor units.

- [x] Run the component tests to confirm failure. Implement forms with native inputs and existing Button/GroupedList components. Store one draft ID for the lifetime of the form, including save retries. Use a km/miles segmented control following the existing reference-page pattern, convert only when saving, and avoid double-converting loaded edits.
- [x] Sort history by job date then creation time. Render rows at a consistent minimum height with expandable detail. Show empty and no-matches states separately. Use React text nodes for all supplied content. Overview shows recent jobs; a new bike has no invented service baseline and no calculated overdue status.
- [x] Add edit and delete confirmations. Remove does not affect another motorcycle's history. Preserve registration/photos as private bike data. Changes from lessons and diagnostic guides never call the maintenance save action.
- [x] Run all component tests and project checks; commit `feat: add simple job logging and searchable bike history`.

### Task 3: Private photographs and optional receipts

**Files:** Upload utility/API/editor components from the file map; new CLI-created `supabase/migrations/*_garage_files.sql`; generated database types; create `scripts/test-garage-storage.ts` using the local test-client helper. Add explicit pinned sharp dependency, keeping the lockfile.

**Interfaces:** File functions above. `BikePhotoEditor({bike,onChanged}:{bike:BikeView;onChanged:()=>void})`; `ReceiptUpload({bikeId,jobId,onChanged}:{bikeId:string;jobId:string;onChanged:()=>void})`. The job exists before receipts can attach, so a receipt failure never loses the core maintenance entry.

- [x] Write failing tests for wrong content, an oversized image, too many decoded pixels, a corrupt image, a failed upload, restoring the default, duplicate finalisation and a foreign path. API tests cover 401/404/400/413/415 and successful POST/GET/DELETE. Decode actual small JPEG fixtures containing location metadata, then assert processed output metadata no longer contains it.

```ts
const jpegBuffer = await sharp({create:{width:20,height:20,channels:3,
  background:{r:80,g:80,b:80}}}).withExif({IFD0:{ImageDescription:'location fixture'}}).jpeg().toBuffer()
expect((await sharp(jpegBuffer).metadata()).exif).toBeDefined()
const processed = await normaliseBikePhoto(jpegBuffer)
const metadata = await sharp(processed).metadata()
expect(metadata.exif).toBeUndefined()
expect(metadata.width).toBeLessThanOrEqual(1600)
```

Define `normaliseBikePhoto(buffer:Buffer):Promise<Buffer>` in uploads.server.ts. It uses `sharp(buffer,{limitInputPixels:40_000_000}).rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer()` and never copies metadata. Add an EXIF GPS fixture too, and confirm all embedded metadata is removed. Define `readOwnedUpload(account:AccountContext,input:FileInput):Promise<Buffer>` there to check the owned bike/job, exact path and byte limit before decoding. Run `npm install --save-exact sharp@0.35.5` so the image processor is an explicit dependency rather than relying on Next.js's transitive copy.

- [x] Create private `garage-photos` and `garage-receipts` buckets with a 10 MiB file limit and allowed content types. Storage policies scope all read/insert/update/delete operations to the user's UUID as the first path segment. Authenticated role alone is insufficient. Add `garage_files(id,owner_id,bike_id,job_id,kind,path,filename,created_at)` with unique storage path and same-owner composite foreign keys to bikes/jobs. Add a check that bike photos have no job ID and receipts do. Use owner policies matching earlier tables.

```sql
-- Use separate policy names and operations on storage.objects, scoped to these buckets only.
bucket_id in ('garage-photos','garage-receipts')
and (storage.foldername(name))[1] = (select auth.uid())::text
```

- [x] Upload directly from the authenticated browser to Storage rather than sending a 10 MiB file through a serverless form body. The server finalisation route receives only FileInput metadata, downloads that user's uploaded object, validates actual bytes and target ownership, then writes metadata. Do not trust MIME labels or filenames alone. Use `<userId>/bikes/<bikeId>/<fileId>.source` for pending photos and `<userId>/bikes/<bikeId>/<fileId>.webp` for processed photos. Pending receipts use `<userId>/jobs/<jobId>/<fileId>.<extension>.source`; the server writes `<userId>/jobs/<jobId>/<fileId>.<validated-extension>`. Final objects and metadata writes require the restricted server transition.
- [x] For a photo, save the processed image and new bike override before removing the old image. Cancelling, decode failure or upload failure keeps the old override. Default restoration sets photo_path to null only after explicit confirmation; the library image resolves dynamically. For receipts, retain successful uploads if a later one fails, report each result, and enforce the 10-file limit while holding a job-row lock. Stable file IDs prevent retries creating duplicate attachments. Cleanup pending source objects after successful finalisation; keep enough file ID/path information to retry cleanup after a partial failure.
- [x] Download receipts only through an owned short-lived signed URL and attachment disposition. Never inject PDF or SVG content into a page. On refresh after a signed URL expires, request another URL. Clear URLs on sign-out/account change. Before hard removal of a bike/job, remove its owned files; if removal fails, retain the record and expose a retry, rather than silently losing the list of files to clean up.
- [x] Run actual two-account Storage tests: B cannot list/read/sign/replace/delete A's object; anonymous access fails; A can read their object; cancelled image edit leaves the library; restoring one bike leaves another bike/model library unchanged. Record that a URL legitimately issued to A is a short-lived bearer link; B must not be able to obtain it through the application.
- [x] Run targeted tests, real storage tests and project checks; commit `feat: add private bike photos and optional maintenance receipts`.

### Task 4: Owner exports and stage review

**Files:** export utility and API/tests from the file map; modify BikeWorkspace and MaintenanceHistory to expose an Export records action. Extend component tests.

**Interfaces:** Export functions above. JSON contains bike details, every job/task state, completion dates, origins, template versions and attachment filenames/IDs, but no secrets, expiring URLs or another bike's records. CSV has one row per task with bike, job date, mileage, job status, task action/state/notes, previous notes, cost and currency. Receipt downloads remain separate; no bulk archive is promised in this version.

- [x] Write failing tests for quotes, commas, line breaks, Unicode, HTML-looking text, zero cost and formula prefixes. Include this concrete spreadsheet test:

```ts
import { bikeFixture, jobFixture } from '@/test/garageFixtures'
const bike = bikeFixture()
const job = jobFixture()
const text = exportBikeCsv(bike,[{
  ...job, notes:'=HYPERLINK("https://other.example")',
  tasks:[{...job.tasks[0],notes:'+SUM(1,2)'}],
}])
expect(text).toContain("'+SUM(1,2)")
expect(exportBikeJson(bike,[job],[])).not.toContain('access_token')
```

Escape double quotes as `""`, quote fields, and prefix cells whose first non-whitespace character is `=`, `+`, `-` or `@` with an apostrophe. Do not alter stored notes.

- [x] Run export tests and confirm failure. Implement deterministic exports, preserving dates as calendar strings and numeric km values. The API validates the owned bike and supported format, returns attachment headers, and requires no model pack. Add 401 and foreign-bike 404 tests. File names use a sanitised bike nickname/ID, not raw user text in a header.
- [x] Run all stage tests, real database/storage tests and project checks. Have a fresh reviewer check private records, file access, upload failures and the complete spec coverage for stages 1–2. Commit `feat: export personal maintenance records`. Continue to templates only after the stage review passes.

Stage implementation and task/stage reviews completed locally. The ten recorded rulings and costs are in [garage-decisions.md](../../garage-decisions.md). Final scoped review passed for all blocking findings. Native browser/paper checks, the minor photo-expiry follow-up and hosted release remain tracked in [garage-acceptance.md](../../garage-acceptance.md).
