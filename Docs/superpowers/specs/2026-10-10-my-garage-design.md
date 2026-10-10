# My Garage and maintenance checklists

Design for review, 10 October 2026.

## Purpose and agreed direction

My Garage is a collection of the user's motorcycles. Maintenance lives inside each bike. Keep recording a job quick enough to use while working. Match CrankDoc's existing cards, grouped lists, blue controls, spacing, and light and dark themes.

David selected bike cards after reviewing the interactive preview. Costs and receipts are optional. David also requested reusable maintenance templates, a checklist for use on a tablet or on paper, checkboxes for completed work, and notes on each line.

This document describes the proposed behaviour. It does not approve new source material for publication. The content rights review remains parked in TASKS.md.

## Garage and individual bikes

The overview contains an Add bike action and one card per physical motorcycle. Each card shows an image, nickname or model name, model year, latest recorded mileage, and last logged maintenance. The entire card opens that bike. Use two columns where space allows and one column on phones.

Two motorcycles of the same model have separate mileage and histories. Both can use the same purchased model pack within its coverage. Support adding an unlisted model with a manually entered make, model and year; reference content and verified templates are available only for supported coverage. A motorcycle without a pack can still have a maintenance log.

Each bike has Overview, Maintenance and Bike details tabs. Overview shows recent maintenance and links to model reference and diagnostics. Maintenance shows jobs in progress and a searchable history, newest first. Bike details stores the bike's nickname, make, model, year, variant and mileage. Registration details are optional and private. No identifying details appear on public model pages.

Archive a sold bike without erasing its history. Removing a bike and its records is a separate explicit action. Personal records belong to the account and can be exported without requiring an active model pack.

## Quick maintenance entries

Log maintenance offers two paths: Quick entry and Use a template. Quick entry asks for date, mileage and work performed. Optional details contain notes, parts, performer, cost and receipts. No receipt or cost is needed to save a job.

Cost means the total amount for the job, paired with its currency. Do not force a breakdown into labour and parts. Receipt files belong to the job and remain private. Support image and PDF receipts, validate file types and sizes, and show an upload failure without losing the rest of the entry. Upload limits are an implementation detail to specify in the plan.

A job may contain several tasks. Saving a historical job must not lower the bike's latest mileage. Changes to recorded work are explicit edits. Taking a lesson or walking through a diagnostic guide does not record maintenance automatically.

## Template choices

Recommend a small picker inside the selected bike, rather than a large global template library. Offer verified scheduled services at their actual intervals, time-based services where supported, and individual tasks. User-created templates allow repeated personal checklists and are clearly labelled Custom.

Do not assume every model has a 10,000 km service. The current Honda data contains 12,000 km intervals, among others. Available scheduled templates must be checked against the correct model, year, market and variant before they are labelled verified. Where those details are unknown, ask the user to confirm them before applying a variant-specific template.

The current service data has names, distance/time intervals, descriptions, torque and fluid notes. It is not sufficient to generate verified service checklists by simply selecting equal intervals or applying a distance modulo calculation. One-off first services, inspection versus replacement, model conditions and time-based work need explicit rules reviewed against the source.

Each verified template records its source, page references, version, coverage and tasks. Use original CrankDoc task wording. Preserve the required action: inspect, clean, adjust or replace. An inspection may lead to replacement, but it must not be labelled as an unconditional replacement.

Time-based work belongs in the checklist only when applicable to the selected service or explicitly added. Explain why a task was included. With missing history, show that due status is unknown and let the user include it deliberately. Do not claim an automatic full list of overdue maintenance.

## Working through a checklist

Starting a template creates an independent job for that motorcycle. Copy the template version and task text into the job so later template edits do not rewrite an existing checklist or service history.

The tablet view shows the bike, service title, job mileage and a quiet progress count such as 4 of 12 tasks done. Rows have a large checkbox, the task action and an expandable notes area. Keep supporting reference, relevant specifications and any task warning inside the expanded row. Essential warnings must remain visible before starting the affected task. Do not invent missing procedure or specification details.

Tasks begin To do. Ticking a checkbox changes a task to Done and records when it was marked. Optional row actions allow Skipped or Not applicable with a reason. Those states do not count as Done. Unticking returns the task to To do; retain its notes. Notes can hold observations, measurements, parts and follow-up findings. A separate follow-up system is outside this first version.

Save progress while working and allow the user to leave and resume the job. Show whether changes have been saved. If saving fails, retain the unsaved form, show a retry action, and never claim the work is stored. Offline synchronisation is outside the first version.

Finish and log asks for the date and mileage and shows unfinished or skipped tasks before confirmation. Users can finish with remaining work, but the history then says Partially completed and preserves every task's state and notes. Completed means all applicable tasks were done; skipped and unfinished tasks prevent that label. Not applicable tasks require a recorded reason.

Quick entries can be saved as custom templates using their task descriptions. New jobs always start with fresh task states, empty completion dates, and empty work notes; costs and receipts are not copied into a template.

## Paper and tablet

The same checklist has a print layout suitable for A4 or Letter paper. Print the bike identity, template name/version, date and mileage fields, task actions, checkboxes, writing space per line, and applicable warnings. Hide navigation, buttons and empty upload controls. Keep a task and its notes together where possible. A filled checklist includes recorded states and notes; an unstarted checklist provides blank fields.

Tablet use provides the interactive checklist. Printing does not mark anything completed. Paper ticks do not automatically become digital records; the user enters the results when back in CrankDoc. Scanning handwriting or recognising ticks is outside this first version.

## Storage and access

The existing garage stores selected catalogue model IDs in the browser. Account-backed motorcycle records and private maintenance records are new work. Keep catalogue models and personal motorcycles separate. Link jobs to physical bikes, task results to jobs, and private attachments to jobs. Link template versions to model coverage or to the owner of a custom template.

Personal users can access only their own motorcycles, jobs and attachments. Receipt links must not be public. The college licensing direction remains recorded, but organisation membership, shared workshops and instructor approval are separate implementation work. Do not expose personal records to a college by default.

Retain existing selected-model shortcuts when introducing individual bike records. Do not silently discard browser data or invent mileage/history while migrating it. Update the current public claim that accounts will never be required when account-backed garage features are introduced.

## Verification

Verify adding duplicate models creates independent bikes and histories. Verify quick entries work without optional fields; historical mileage does not lower the latest reading; searching finds jobs and notes; and archiving retains history.

Verify starting a template copies the version, starts fresh states, and isolates each job. Verify per-line notes survive progress saves, failed saves remain visible, skipped tasks do not count as done, and partial jobs are labelled accurately. Verify later template changes leave existing jobs unchanged.

Verify private records and receipts cannot be accessed through another account. Check upload failures and exports. Verify scheduled template content against the stated source before release, including first-service and variant conditions.

Check keyboard use, 44 px touch targets, consistent rows, narrow phones, tablet layouts, both themes, and the print layout on A4 and Letter. These are completion criteria, not claims that the feature is implemented or tested.
