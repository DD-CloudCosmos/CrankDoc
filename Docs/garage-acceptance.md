# My Garage local acceptance

10 October 2026. Branch `codex/my-garage`, isolated worktree `circuit-explorer`. Local implementation and automated evidence are ready for controller review. Browser appearance, actual paper output, final branch/security reviews and live release are outstanding. No hosted migration, authentication setting, push or deployment was performed.

## Requirements and evidence

| Requirements | Evidence in this branch | Result and limits |
| --- | --- | --- |
| ACC-01–06 | `scripts/test-garage-auth.ts`, account component/server tests, private-page/session tests | Local mandatory confirmation, mailbox links, same-browser Proof Key for Code Exchange (PKCE), recovery and replacement password pass. Stable ownership, public browsing and retained failed form values tested. Hosted mail delivery remains a release check. |
| BIKE-01–08 | `scripts/test-garage-access.ts`, `scripts/test-garage-import.ts`, garage form/card/workspace tests | Two owners and anonymous requests, duplicate physical bikes, archive/restore, confirmed year scope, retry and import idempotence pass. Failed cleanup retains attachment records. |
| PHOTO-01–05; FILE-01–03 | `scripts/test-garage-storage.ts`, `scripts/test-garage-built-pdf.ts`, photo/receipt component and byte-validation tests | Private storage isolation, actual bytes, metadata removal, limits, retries and source cleanup failure pass. Built Hypertext Transfer Protocol (HTTP) endpoint accepts a valid Portable Document Format (PDF) file with 200 and rejects two malformed PDFs with 415; deployment traces include all parser dependencies. Native browser photo/receipt appearance remains unverified. |
| LOG-01–08 | `scripts/test-garage-access.ts`, quick-entry/history/domain tests | Server calendar/cost/mileage/task limits, zero and unknown values, latest-mileage preservation, retry/race/conflict behaviour and owner denial pass. Notes remain plain text. |
| TEMPLATE-01–08 | `scripts/validate-maintenance-templates.ts`, `scripts/test-garage-templates.ts`, template picker/form/domain tests; [source coverage](maintenance-template-coverage.md) | All 75 structured entries pass validation. Exact source content received independent approval before local promotion. Private definitions, version conflicts, immutable snapshots and changed task keys pass. Unknown due status remains explicit. |
| CHECK-01–08 | `scripts/test-garage-access.ts`, checklist component/hook/domain tests | Atomic final task/closure, timestamp preservation, manual partial closure, reopen, serialized saves, retry, concurrent revisions and retained drafts pass. No public browser draft storage. |
| CARRY-01–08 | `scripts/test-garage-carryover.ts`, carry picker/quick-entry/domain tests | Latest-created source only, selected unfinished tasks, stable-key merge, prior observations, rollback, retry, explicit source closure and owner isolation pass. |
| EXPORT-01–03 | `scripts/test-garage-export.ts`, JSON/CSV domain tests | The real local API cap is 1,000 rows. Built exports preserve all 1,001 jobs and attachments, recorded facts and owner/bike scope. Comma-separated values (CSV) formula prefixes and quoted text are covered. |
| PRINT-01–03 | `PrintChecklist.test.tsx`, saved-job and blank-template print route tests | Seven tests pass: four actual states, notes/reasons/origins, source/version, date/mileage, empty writing space, long text and foreign combinations. Print calls only `window.print()` on click and leaves input unchanged. Blank preview is read-only, owner-scoped and coverage-checked; it explicitly includes only the base template. Scoped paper rules use auto page size, 12 mm margins and monochrome labels. Actual A4/Letter pagination and printer output remain unverified. |
| UX-01–03; ACC-04–05 | Component/accessibility/session tests and existing semantic styles | Labels, status errors, keyboard controls, touch-size classes, theme tokens and draft retention tested. Responsive appearance, actual touch/keyboard use and both themes require the browser specification below. |

## Engineering gates

`npx tsx scripts/validate-maintenance-templates.ts`: 75 valid verified entries, zero drafts. Validation is structural, not mechanical approval.

`npm run test`: 178 test files and 1,476 tests passed. `npm run test:coverage`: the same 1,476 tests passed; overall statement coverage 88.87%, branches 82.46%, functions 90.31%, lines 92.84%. The checklist hook has 94.87% statements, 84% branches and 100% lines. Existing jsdom navigation messages occur in broad test output; focused print output is quiet.

`npx tsc --noEmit`: passed. `npm run lint`: zero errors, five existing warnings in BikeDetailTabs.test.tsx, GlossaryImageModal.tsx, GlossaryList.tsx and SpecSheet.tsx. `npx tsx scripts/start-garage-local.ts build`: fully isolated production build passed, including both dynamic print routes. The helper excludes the entire live environment file rather than overriding selected keys.

All eight local suites named above passed against the local database and storage. `scripts/test-garage-local-runtime.ts` checks real HTTP garage/account responses, the served browser bundle's loopback project URL, absence of the live environment file for the child lifetime and restoration of the same symlink after a failed child and interruption. It does not open a browser or claim a visual result.

## Source approval and trust boundary

[The coverage record](maintenance-template-coverage.md) records independent approval of 39 April 2008 CB1000R entries and 36 European 2023 CB650RA entries. The approved pre-promotion SHA-256 hashes are `75e2e32f4376dfafc9700a01ae469fa7b7a8e4a9179b595f599a02e6b7e9807d` and `a2de80af2e68f833f85fc12a667fae1c657c8f2c13f4348b396f47db790b1175`. Only verification flags and review notes were promoted. No 2021–22 workshop value was used for an absent 2023 value. Missing procedures/specifications remain unassessed; conditional ED evaporative work remains separate.

Application starts resolve the owner's saved personal definitions or approved static definitions on the server. Generic quick/carry starts accept template-free work. Raw structurally valid owner-submitted database snapshots are private owner-authored history, not certified source facts. Personal templates cannot become reviewed shared definitions. Stronger provenance for shared workshops or college certification is outside this release. Content-rights approval remains separate from content review and local enablement.

## Local setup

Use this worktree with its dependencies installed. Start the local Supabase stack with `DOCKER_HOST=unix:///Users/david/.colima/crankdoc/docker.sock npx supabase start`. Store local `supabase status -o env` output in `.env.garage.local`; never use the live `.env.local` to seed or launch this preview. Do not print the keys in chat or logs. Apply the branch migrations only to this disposable local stack; do not reset a stack whose private test data must be retained.

Run `npx tsx scripts/seed-garage-local-reference.ts`. Its guard rejects non-loopback URLs. It upserts only the two public catalogue model identities from `data/motorcycles/honda-cb1000r-2008.json` and `honda-cb650ra-2023.json`, with their exact identifiers and image paths. It creates no account or private motorcycle. This is necessary because the local catalogue may otherwise lack the static template model identifiers. Sign up normally through the local application, confirm through the local mailbox, add your own physical bike and confirm exact year, market and variant in Bike details. Unlisted bikes can use personal templates.

Use `npx tsx scripts/start-garage-local.ts dev` for the local application on `http://localhost:3110`. Use `build`, then `start`, for a production runtime and native PDF checks. The helper loads only `.env.garage.local`, passes an explicit minimal child environment, binds runtime traffic to 127.0.0.1 and leaves the existing port 3107 runtime alone. It moves the complete live `.env.local` out of Next.js autoload paths for the entire child lifetime and restores the original inode/symlink on exit, failure or handled interruption. It rejects other Next.js autoload environment files. Do not run two isolated launchers concurrently. If a machine is forcibly stopped, restore `.env.local.garage-runtime-excluded` to `.env.local` before launching again. No process can restore files after an uncatchable kill or power loss.

Run each local suite with `npx tsx scripts/test-garage-<name>.ts`, where name is auth, access, import, storage, export, built-pdf, carryover or templates. Build before built-pdf/export. Run `npx tsx scripts/test-garage-local-runtime.ts` after build to verify isolation and runtime wiring. Tests create and remove their own local fixtures.

## Outstanding browser acceptance specification

Browser automation was not authorized. Do not mark these checks passed from components or HTTP results. Once separately authorized, use two confirmed local accounts and capture 320 px phone, 768 px tablet and desktop views in both themes. Check horizontal overflow, visible focus, 44 px touch targets, collapsed details, retained failed forms and readable warnings. Exercise confirmation/recovery, duplicate-model bikes, library photo restoration, optional receipts, partial completion, selected carry-over, save retry, concurrent conflict/reload, sign-out and switching owners in the same browser. Public pages must remain accessible.

Open saved-job and blank-template print routes. Verify a To do observation does not become Done, Skipped/Not applicable reasons and Previous activity notes remain separate, warnings/source/version are present, blank date/mileage and writing space remain blank, and Print performs no write. Render both A4 and Letter PDFs for a short checklist and maximum-length notes/reference/origins. Inspect every page for clipped text, overflow, split short task groups, navigation/actions/uploads and monochrome meaning. Check a personal template, a supported static template and an unsupported/foreign direct URL. Actual print pagination remains outstanding until this is done.

## Release decision still required

These are the exact new migrations since baseline `3c59973`, in execution order. They are new branch files, locally applied for testing; hosted application is not approved.

| Migration | Hosted action |
| --- | --- |
| `20261010152038_garage_bikes.sql` | Separate release approval required |
| `20261010152828_garage_bike_text_limits.sql` | Separate release approval required |
| `20261010160341_maintenance_jobs.sql` | Separate release approval required |
| `20261010160835_maintenance_jobs_anonymous_grants.sql` | Separate release approval required |
| `20261010163942_garage_files.sql` | Separate release approval required |
| `20261010164950_garage_upload_cleanup_gate.sql` | Separate release approval required |
| `20261010170602_garage_files_server_transition.sql` | Separate release approval required |
| `20261010174520_maintenance_checklists.sql` | Separate release approval required |
| `20261010174720_maintenance_checklist_task_variable.sql` | Separate release approval required |
| `20261010182959_start_maintenance_job.sql` | Separate release approval required |
| `20261010183324_carried_match_pending.sql` | Separate release approval required |
| `20261010184042_preserve_carried_origins.sql` | Separate release approval required |
| `20261010184611_maintenance_templates.sql` | Separate release approval required |

| Hosted setting or launch item | Required release work | Status |
| --- | --- | --- |
| Email/password authentication | Enable signup and mandatory email confirmation; minimum password length 8 | Not changed or verified hosted |
| Site URL | Set the approved production origin and matching NEXT_PUBLIC_SITE_URL | Release origin decision required |
| Redirect allow-list | Allow exact approved-origin `/auth/callback?next=/garage`, `/auth/callback?next=/account/reset-password` and the callback path used by the app; add approved preview origins only deliberately | Not changed hosted |
| Recovery and confirmation delivery | Configure and verify mail delivery, quotas, confirmation links and same-browser PKCE recovery with real hosted accounts | Not verified hosted |
| Private storage | Verify migration-created private `garage-photos` and `garage-receipts` buckets, ownership policies and 60-second download renewal after migration | Local evidence only |
| Source publication and content rights | Separately approve reviewed template publication and parked manual-content rights | Not approved for live publication |
| Browser and paper acceptance | Execute the specification above in both themes and both page sizes | Not authorized/performed |
| Task, whole-branch and security review | Controller obtains fresh reviews and resolves concrete findings before merge | Pending controller |
| Push, preview, merge and production deploy | Obtain David's separate live release decision after all prerequisites | Not performed |

No external-provider sign-in, institutional single sign-on, hosted email branding or pack enforcement is introduced. Public browsing remains available; private garage access uses a stable account identity.
