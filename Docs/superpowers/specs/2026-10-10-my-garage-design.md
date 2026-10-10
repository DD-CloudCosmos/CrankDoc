# My Garage and maintenance checklists

Design for review, 10 October 2026.

## Purpose and agreed direction

My Garage is a collection of the user's motorcycles. Maintenance lives inside each bike. Keep recording a job quick enough to use while working. Match CrankDoc's existing cards, grouped lists, blue controls, spacing, and light and dark themes.

David selected bike cards after reviewing the interactive preview. Costs and receipts are optional. David also requested reusable maintenance templates, a checklist for use on a tablet or on paper, checkboxes for completed work, and notes on each line.

This document describes the proposed behaviour. It does not approve new source material for publication. The content rights review remains parked in TASKS.md.

## Garage and individual bikes

The overview contains an Add bike action and one card per physical motorcycle. Each card shows an image, nickname or model name, model year, latest recorded mileage, and last logged maintenance. The entire card opens that bike. Use two columns where space allows and one column on phones.

New bikes use CrankDoc's library image for the matching model and generation by default. ChatGPT-created model illustrations form part of that library and need review before publication. Where no matching image exists, show a neutral bike placeholder; adding a motorcycle never requires a photograph.

Offer a discreet Edit image action on the individual bike page. It lets the owner choose a photograph from their device, preview it, and save or cancel. Saving replaces the image on that motorcycle's garage card and bike page. Keep the existing image until the replacement is successfully saved. The user can replace their photograph again or choose Restore library image to return to the model default. This edits only that physical bike's image, not the shared library image or another bike of the same model.

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

Starting a template creates an independent job for that motorcycle, with its own date and mileage. Copy the template version and task text into the job so later template edits do not rewrite an existing checklist or service history. The job remains In progress until every task is marked Done or the user explicitly selects Complete job. Leaving the page, printing, or passing a scheduled date or mileage never closes it.

When creating a new maintenance activity, offer unfinished tasks from the previous activity for this physical motorcycle. Show To do and Skipped tasks so the user can select which to carry over; exclude Done and Not applicable tasks. Carry-over is optional and never crosses between bikes. Keep the offer collapsed or absent when there is no outstanding work.

Selected tasks start To do in the new activity, with a link to the original task and activity. Show earlier notes and measurements as Previous activity notes, keeping them distinct from observations made during the new job. Preserve the original task's state, notes, date and mileage. If the new checklist already contains the same identified task, attach the carry-over link and previous notes to that row rather than duplicating it. Do not merge tasks solely because their names look similar.

Also offer Complete previous activity, unselected by default. Apply that choice only after the new activity and its carried-over tasks have been saved successfully. If the previous activity is already closed, do not offer to close it again. Closing a previous activity with outstanding work records it as Partially completed and shows where selected tasks were carried over. Starting a new job alone never closes the old one, and moving or later completing a task in the new job does not retrospectively mark the original work Done. Cancelling or a failed save leaves the previous activity unchanged.

The tablet view shows the bike, service title, job mileage and a quiet progress count such as 4 of 12 tasks done. Rows have a large checkbox, the task action and an expandable notes area. Keep supporting reference, relevant specifications and any task warning inside the expanded row. Essential warnings must remain visible before starting the affected task. Do not invent missing procedure or specification details.

Tasks begin To do. Ticking a checkbox changes a task to Done and records when it was marked. Optional row actions allow Skipped or Not applicable with a reason. Those states do not count as Done. Unticking returns the task to To do; retain its notes. Notes can hold observations, measurements, parts and follow-up findings. A separate follow-up system is outside this first version.

Save progress while working and allow the user to leave and resume the job. Show whether changes have been saved. If saving fails, retain the unsaved form, show a retry action, and never claim the work is stored. Offline synchronisation is outside the first version.

Marking the last task Done automatically closes the job as Completed and adds it to the bike's maintenance history using the job's recorded date and mileage. Show the saved result and allow those details to be corrected. Closing is saved together with the final task update; a save failure must not show the job as successfully closed.

Complete job is also available while work remains. It shows the date, mileage and unfinished or skipped tasks before confirmation. Explicitly closing a job with unfinished or skipped work creates a Partially completed history entry and preserves every task's state and notes. It does not tick outstanding tasks. Completed means all applicable tasks were done; Not applicable tasks require a recorded reason and may be excluded only through explicit completion. Costs and receipts remain optional and do not keep an otherwise finished job open.

Quick entries can be saved as custom templates using their task descriptions. New jobs start with fresh task states, empty completion dates, and empty work notes. Explicitly carried-over tasks can show earlier notes separately as described above. Previous observations, costs and receipts are not copied into a reusable template.

## Paper and tablet

The same checklist has a print layout suitable for A4 or Letter paper. Print the bike identity, template name/version, date and mileage fields, task actions, checkboxes, writing space per line, and applicable warnings. Hide navigation, buttons and empty upload controls. Keep a task and its notes together where possible. A filled checklist includes recorded states and notes; an unstarted checklist provides blank fields.

Tablet use provides the interactive checklist. Printing does not mark anything completed. Paper ticks do not automatically become digital records; the user enters the results when back in CrankDoc. Scanning handwriting or recognising ticks is outside this first version.

## Storage and access

The existing garage stores selected catalogue model IDs in the browser. Account-backed motorcycle records and private maintenance records are new work. Keep catalogue models and personal motorcycles separate. Link jobs to physical bikes, task results to jobs, and private attachments to jobs. Link template versions to model coverage or to the owner of a custom template.

Personal users can access only their own motorcycles, jobs and attachments. Receipt links must not be public. The college licensing direction remains recorded, but organisation membership, shared workshops and instructor approval are separate implementation work. Do not expose personal records to a college by default.

Owner-uploaded bike photographs are private account content linked to the physical bike. They are not added to the public model library. Validate image uploads, remove embedded location metadata from the stored display image, and show upload failures without changing the saved image. Store the personal image override separately from the model's library image so restoring the default is explicit and reliable.

Retain existing selected-model shortcuts when introducing individual bike records. Do not silently discard browser data or invent mileage/history while migrating it. Update the current public claim that accounts will never be required when account-backed garage features are introduced.

## Verification

Verify adding duplicate models creates independent bikes and histories. Verify quick entries work without optional fields; historical mileage does not lower the latest reading; searching finds jobs and notes; and archiving retains history.

Verify a new bike displays its matching library image or a placeholder. Verify saving a personal photograph updates both the card and bike page, cancelling or a failed upload keeps the existing image, and restoring the library image removes the override. Verify another bike of the same model and the shared model library remain unchanged. Verify private photos cannot be accessed through another account and embedded location metadata is removed from display images.

Verify starting a template copies the version, starts fresh states, and isolates each job. Verify leaving and returning, printing, or passing an interval keeps an unfinished job active. Verify marking every task Done closes it once and creates one history entry. Verify explicit completion preserves outstanding task states and labels partial jobs accurately. Verify optional costs and receipts do not block completion, per-line notes survive progress saves, failed saves remain visible, and skipped tasks do not count as done. Verify later template changes leave existing jobs unchanged.

Verify carry-over offers only unfinished tasks from the previous activity for the same bike and preserves user selection. Verify carried-over tasks start To do, retain links and clearly labelled previous notes, and do not duplicate an existing identified task. Verify the old activity stays open unless the user explicitly chooses to close it, already-closed activities are not closed again, and cancellation or a failed save does not alter the source activity. Verify completing the new task preserves the original history and closing the previous activity leaves unperformed work labelled accurately.

Verify private records and receipts cannot be accessed through another account. Check upload failures and exports. Verify scheduled template content against the stated source before release, including first-service and variant conditions.

Check keyboard use, 44 px touch targets, consistent rows, narrow phones, tablet layouts, both themes, and the print layout on A4 and Letter. These are completion criteria, not claims that the feature is implemented or tested.
