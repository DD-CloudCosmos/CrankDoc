# My Garage product requirements

10 October 2026. Implementation baseline derived from the approved [design](../specs/2026-10-10-my-garage-design.md) and [plan](../plans/2026-10-10-my-garage.md).

## Outcome and scope

An owner can keep several physical motorcycles in a private garage. Each bike has its own photograph, mileage and maintenance history. Logging work is simple. Reusable checklists support workshop use, saved progress and printing.

The first version includes email/password accounts, bike cards, quick entries, optional costs and receipts, personal photographs, custom templates, supported verified service templates, task notes, completion, selected carry-over and exports.

Payments, pack enforcement, college membership, shared workshops, instructor approval, notifications, offline editing, receipt recognition and handwriting recognition are excluded. External-provider sign-in through OAuth is required later. Institutional single sign-on (SSO) remains an option for the college project. Stable account ownership must support those later additions. Current public reference content stays public. The parked content-rights review remains a launch task.

Implementation and tests take place in the isolated worktree and local database. Hosted authentication settings, live migrations, publication of templates and deployment require a separate release decision.

## Accounts and privacy

| ID | Requirement | Acceptance |
| --- | --- | --- |
| ACC-01 | Offer sign-up, email confirmation, sign-in, password recovery and sign-out. | A confirmed user can return to their garage after signing in. Recovery restores account access without changing ownership. Errors retain useful form values. |
| ACC-02 | Public reference and diagnostic pages remain usable without an account. | Signing out does not remove public access. Existing administrator protection still works. |
| ACC-03 | Private data belongs to a stable account identifier. | A second account cannot read, edit, delete or attach files to the first account's bikes, jobs or templates, including direct requests. |
| ACC-04 | Private responses and drafts must not enter shared caches or public browser storage. | Sign-out clears displayed private data. Another account on the same device receives none of the previous account's content. |
| ACC-05 | Session expiry and save errors preserve unsaved work visibly. | The interface offers sign-in or retry and never labels an unsuccessful save as saved. |
| ACC-06 | Update the claim that accounts will never be required. | The public site explains that browsing is public and My Garage uses an account. |

Private photographs, registration details and receipts must never appear on public model pages. Receipt links expire and can be renewed only by their owner. A legitimately issued download link is a temporary bearer link; it must never be discoverable through another account.

## Garage and physical bikes

| ID | Requirement | Acceptance |
| --- | --- | --- |
| BIKE-01 | Show one card per physical motorcycle, with an Add bike action. | Each card shows the image, nickname or model, year, latest mileage and last logged work. The whole card opens that bike. |
| BIKE-02 | Support several bikes of the same model. | Adding the same catalogue model twice creates distinct bikes with independent records. |
| BIKE-03 | Allow supported catalogue models and manually entered unlisted models. | Unknown year or mileage is allowed. Unlisted bikes still have logs and custom templates; unsupported reference content is unavailable. |
| BIKE-04 | Provide Overview, Maintenance and Bike details tabs. | Overview shows recent work and available reference/diagnostic links. Maintenance puts active jobs above history. Details permits explicit corrections. |
| BIKE-05 | Keep identity and optional private registration in bike details. | Nickname, make, model, year, variant, market and mileage can be edited. No service baseline is invented for a new bike. |
| BIKE-06 | Archive sold bikes without erasing history. | Archived bikes have a separate view and can be restored. Hard removal is a separate confirmed action. |
| BIKE-07 | Offer explicit import of existing browser model selections. | Cancelling changes nothing. Retrying import creates no duplicates, leaves year/mileage unknown and retains existing shortcuts and experience preferences. Ordinary Add bike can still add a duplicate model. |
| BIKE-08 | Retain private file references if cleanup fails during removal. | Failed file removal leaves the record available for retry rather than losing the list of attachments. |

Cards use two columns where space allows and one column on phones. My Garage joins desktop navigation and the mobile More menu. Existing mobile tabs and diagnostic shortcuts remain available.

## Bike photographs

| ID | Requirement | Acceptance |
| --- | --- | --- |
| PHOTO-01 | Default to the matching CrankDoc model/generation image. | A missing image uses a neutral placeholder. Adding a bike never requires a photograph. |
| PHOTO-02 | Provide a discreet Edit image action within the bike page. | The owner selects a file, previews it and saves or cancels. Cancel and failed saves keep the previous image. |
| PHOTO-03 | Apply a saved personal photograph to this bike's card and page. | Another bike of the same model and the shared image library are unchanged. |
| PHOTO-04 | Offer Restore library image. | Explicit restoration removes only this bike's override and resolves its current library image. |
| PHOTO-05 | Validate actual image contents and remove embedded metadata. | Corrupt, unsupported or oversized images are rejected. The saved display image contains no location metadata. |

## Quick maintenance entries and history

The primary flow is: open a bike, choose Log maintenance, enter date/mileage/work, then save. Optional details stay collapsed. A second path starts from a template. Lessons and diagnostic sessions never create records automatically.

| ID | Requirement | Acceptance |
| --- | --- | --- |
| LOG-01 | Require a calendar date, mileage and work performed. | One or more performed tasks save as Done. No optional field is needed. Zero mileage is valid. |
| LOG-02 | Offer optional notes, parts, performer, total cost/currency and receipts. | Blank cost remains unknown, distinct from zero. No labour/parts breakdown is required. Different currencies are never summed. |
| LOG-03 | Preserve the latest bike mileage when adding or editing historical work. | Lower historical readings and deleted jobs do not lower the latest reading. A deliberate bike-detail correction may lower it. |
| LOG-04 | Save a submitted entry once, including retries. | Repeated submission of the same draft does not duplicate a job or history entry. Save failures retain input. |
| LOG-05 | Search history by job title, task labels and notes. | Matching is insensitive to letter case. Empty history and no search matches have different messages. |
| LOG-06 | Sort history by recorded job date, then creation time. | Active jobs appear separately above closed work. Detail rows expand without making the list uneven or crowded. |
| LOG-07 | Make edits and deletion explicit. | The owner can correct recorded details and confirm deletion. Another bike's records remain unchanged. |
| LOG-08 | Treat notes and filenames as plain text. | HTML-looking text is shown as text and remains searchable. |

## Templates and source accuracy

| ID | Requirement | Acceptance |
| --- | --- | --- |
| TEMPLATE-01 | Show a small bike-scoped picker grouped into Scheduled service, Time-based work, Individual tasks and My templates. | Only supported, confirmed coverage appears as verified. Unknown required coverage prompts confirmation instead of guessing. |
| TEMPLATE-02 | Match verified templates to exact model, year, market and variant. | Draft or unverified entries are unavailable. Broad coverage is allowed only where the reviewed source supports it. |
| TEMPLATE-03 | Record source, page references, version, coverage and task definitions. | Each task preserves the required inspect, clean, adjust or replace action in original CrankDoc wording. |
| TEMPLATE-04 | Use actual schedule columns and conditions. | First service is one-off; recurring and time-based work remain distinct. No generic 10,000 km or interval-modulo generator substitutes for source review. |
| TEMPLATE-05 | Explain time-based additions and gaps. | Missing history gives unknown due status. The user may deliberately add applicable work. Missing procedure or specification details are flagged and never invented. |
| TEMPLATE-06 | Support reusable private custom templates and Save as template. | Only definitions copy. States, completion dates, work notes, costs, receipts and carry-over origins do not copy. Custom tasks have no invented safety rating. |
| TEMPLATE-07 | Snapshot the template when starting a job. | Later template edits leave existing jobs and history unchanged. Each new job has fresh task identifiers, empty observations and To do states. |
| TEMPLATE-08 | Permit unlisted bikes to use custom templates. | Lack of verified coverage or an active model pack does not prevent personal logging or custom checklists. |

For this release, source review uses the April 2008 CB1000R factory manual and the 2023 European CB650RA owner manual. A 2021–22 workshop manual is not evidence for absent 2023 workshop values. Verified template content requires line-by-line review against the actual source pages. A validator checks structure; it does not certify mechanical facts. Unverifiable entries remain draft.

## Checklist task and job lifecycle

| Task state | Meaning | Required fields | Counts as Done |
| --- | --- | --- | --- |
| To do | Work is outstanding. | Task definition. | No. |
| Done | Owner records that work was performed. | Completion timestamp recorded when marked. | Yes. |
| Skipped | Work was deliberately left outstanding. | Reason. | No. |
| Not applicable | Owner explains why this task does not apply. | Reason. | No. |

| Event | Required result |
| --- | --- |
| Start a template | Create an independent In progress job with recorded date/mileage. |
| Mark a task Done so every task in the nonempty checklist is now Done | Save task update and automatic Completed closure together. Skipped and Not applicable prevent automatic closure. |
| Leave, print or pass an interval | Retain job state. No automatic closure. |
| Explicitly complete with To do or Skipped tasks | Close as Partially completed; preserve all task states and notes. |
| Explicitly complete with all applicable tasks Done and valid Not applicable reasons | Close as Completed without pretending excluded tasks were performed. |
| Untick a task in an automatically completed job | Return task to To do, clear its completion timestamp, retain notes and reopen the job. |
| Untick a task in a manually closed job | Keep it closed and update the partial/completed label accurately. |
| Edit only notes | Preserve completion timestamps and closure. |

| ID | Requirement | Acceptance |
| --- | --- | --- |
| CHECK-01 | Show bike, job title, recorded mileage and a quiet Done count. | Count excludes Skipped and Not applicable. States remain understandable without colour. |
| CHECK-02 | Provide large checkboxes and expandable per-task notes/reference/specifications. | Essential warnings are visible before affected work begins. Missing guidance is labelled unassessed. |
| CHECK-03 | Save progress and allow later resumption across devices. | Show Saving, Saved or an actionable error. Unsaved input is retained until acknowledged. |
| CHECK-04 | Serialize saves so later typing is not lost behind an earlier request. | Notes entered during a pending save are sent next. Checkbox changes flush pending notes. |
| CHECK-05 | Detect concurrent edits. | A stale update cannot overwrite another device. Show conflict, retain unsaved text and offer Reload saved version. |
| CHECK-06 | Confirm manual completion with date, mileage and unresolved work. | It never ticks unfinished tasks. Costs and receipts never block closure. |
| CHECK-07 | Keep one job/history record through completion. | Closure is atomic with the final task save. A failed save never displays successful completion. |
| CHECK-08 | Warn before leaving unsaved work. | The first version does not promise offline storage or synchronization. |

## Carry unfinished work into a new activity

Previous activity means the most recently created existing job for the same physical bike, ordered by creation time then identifier. It is not a scan through all older jobs or a choice based on the job's recorded service date.

| ID | Requirement | Acceptance |
| --- | --- | --- |
| CARRY-01 | Offer only To do and Skipped tasks from that previous activity. | Done and Not applicable are excluded. No offer appears when nothing is eligible. |
| CARRY-02 | Make task selection optional and initially unchecked. | Cancelling or merely opening the form changes neither activity. |
| CARRY-03 | Start selected work To do with empty current notes. | Link the original activity/task and display its observations separately as Previous activity notes. |
| CARRY-04 | Merge only when the new row has the same non-null stable task key. | Similar names do not merge. Matching rows retain their new definition and receive the origin instead of a duplicate row. |
| CARRY-05 | Offer Complete previous activity separately, initially unchecked. | Already closed sources have no closure option. Starting a new job alone leaves the old one open. |
| CARRY-06 | Create the new activity and optional source closure in one successful save. | Failed saves leave both records unchanged. Retries create no duplicate or repeated closure. Source revision changes produce conflict. |
| CARRY-07 | Preserve historical truth. | Original states, notes, date and mileage remain intact. Completing a new task does not retroactively mark the original Done. Closing unresolved source work records partial completion and links its destination. |
| CARRY-08 | Support the same offer in quick entry. | Performed work starts Done, carried work starts To do. The resulting job stays active until normal completion rules are satisfied. |

## Receipts and exports

| ID | Requirement | Acceptance |
| --- | --- | --- |
| FILE-01 | Attach optional image or PDF receipts to an existing job. | A failed attachment does not lose the saved job or successful earlier uploads. Errors are shown per file. |
| FILE-02 | Validate bytes, type, size and ownership before attachment. | Renaming an unsupported file does not make it acceptable. Repeated finalisation attaches it once. |
| FILE-03 | Download receipts privately. | PDFs are downloaded rather than injected into the application page. A second account and anonymous requests are denied. |
| EXPORT-01 | Export the owner's bike records as JSON or comma-separated values (CSV). | No active model pack is required. Other bikes/accounts, secrets and temporary URLs are excluded. |
| EXPORT-02 | Preserve recorded facts in export. | JSON includes bike/job/task data, origins, versions, timestamps and attachment identifiers/names. CSV has one row per task with states, notes, prior notes, cost and currency. |
| EXPORT-03 | Make CSV safe and readable. | Quotes, commas, newlines and Unicode survive. Spreadsheet formula prefixes are neutralized. Receipt downloads remain separate. |

## Field and file rules

| Field | Rule |
| --- | --- |
| Nickname | At most 80 characters. |
| Make/model/variant/market | At most 120 characters each; make and model required. |
| Registration | Optional, at most 40 characters, private. |
| Year | Unknown permitted; otherwise an integer from 1885 to 2100 within confirmed catalogue coverage when linked. |
| Mileage | Finite and nonnegative; zero valid. Bike mileage may be unknown; jobs require it. Store kilometres to three decimal places after conversion; offer km/miles display. |
| Job date | Valid calendar date, shown without a time-zone shift. |
| Job/task title | Required, at most 160 characters. |
| Job notes, parts, task notes | At most 4,000 characters each. |
| Performer | Optional, at most 120 characters. |
| Skipped/Not applicable reason | Required for those states, at most 500 characters. |
| Task list | Between 1 and 100 tasks per job/template; distinct identifiers. |
| Template version | Positive integer. |
| Cost | Optional nonnegative amount, at most two decimal places, stored as integer minor units. Blank and zero differ. Reject exponent syntax and unsafe numeric values. |
| Currency | EUR, GBP or USD initially; required only with a cost. |
| Bike photograph | JPEG, PNG or WebP; at most 10 MiB and 40 million decoded pixels. Saved display WebP has at most a 1,600 px longest edge and no embedded metadata. |
| Receipts | JPEG, PNG, WebP or PDF; at most 10 MiB each and ten per job. SVG and HTML are rejected. |
| Download link | Private, expires after 60 seconds; renew through an ownership check. |

All rules apply on the server as well as the form. Unknown and foreign identifiers receive the same not-found result. User input never determines ownership.

## Tablet, accessibility and paper

| ID | Requirement | Acceptance |
| --- | --- | --- |
| UX-01 | Match existing CrankDoc semantic colours, cards, grouped rows and segmented controls. | Calm layout, consistent row heights, supporting information collapsed and no wrapping action labels. Light and dark themes work. |
| UX-02 | Support 320–428 px phones, tablets and desktop. | Forms and controls remain usable without horizontal overflow. Touch targets are at least 44 px. |
| UX-03 | Support keyboard and accessible labels/status messages. | Focus is visible, controls have names, validation associates with fields and save errors can be discovered. |
| PRINT-01 | Print the same checklist on A4 or Letter. | Include bike, service/version/source, date/mileage, states, warnings, notes and writing space. Hide navigation, buttons and upload controls. |
| PRINT-02 | Preserve blank and filled checklist facts. | Unstarted sheets have empty boxes and blank date/mileage fields. Filled sheets show actual states, reasons and Previous activity notes. Long text wraps without clipping. Short task/notes groups stay together where practical. |
| PRINT-03 | Keep printing read-only and legible in monochrome. | Print invokes no save or completion action. Paper results are entered manually later. |

## Verification and delivery

The [implementation plan](../plans/2026-10-10-my-garage.md) owns engineering steps. Stage 1 covers ACC and BIKE. Stage 2 adds LOG, PHOTO, FILE and EXPORT. Stage 3 adds TEMPLATE, CHECK, CARRY and PRINT. UX and privacy apply throughout.

Completion requires meaningful component/domain tests, real local two-account database and storage tests, retry/conflict/race tests, template source review, lint, type checking, coverage and a successful application build. Each task gets a fresh review; the whole branch gets a final review including security.

Visual checks must cover phone, tablet, desktop, both themes and printed A4/Letter pages. Earlier browser automation permission was denied. Those checks remain outstanding until separately authorized; component tests are not a substitute for claiming the visual checks passed.

Delivery includes code, new unapplied migrations, source-coverage notes, acceptance evidence and release instructions. Local implementation completion and live release are distinct outcomes. Report any unverified criteria explicitly.
