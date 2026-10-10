# CrankDoc Circuit Explorer: first lesson

## Outcome

Teach a complete beginner why either brake control turns on the brake light. Keep the same verified diagram useful to an experienced mechanic through optional explanations and free exploration. Success means a learner can trace the supply and return path and explain the two switches without hints.

## Scope and entry

Add David’s 2008 Honda CB1000R (SC60) to the motorcycle catalogue, with ABS equipment unconfirmed and both factory sheets clearly labelled. The bike detail page is the primary entry. Its Wiring tab contains the authoritative factory diagram, “Teach me” and “Explore” entry points, and the brake-light lesson. Do not show this bike-specific lesson on unrelated motorcycles.

Use the existing motorcycle and technical-document tables. Prepare an additive, repeatable import that inserts the bike and its source document without deleting or replacing existing catalogue data. The existing reseed script clears data and must not be used to add this bike. Verify specifications against the uploaded manual and leave unsupported optional values empty. Scope the record to the supported 2008 model year; do not claim coverage of other years without evidence.

The lesson can use a dedicated bike-linked route for space, but it is launched from and clearly belongs to this bike. No generic standalone lesson presented in place of adding the motorcycle. Existing wiring diagrams remain available. This phase teaches the brake-light subset verified on both sheets; do not silently combine their other circuits.

## Experience

Use CrankDoc’s current light/dark theme, typography, cards, buttons and segmented control. This overrides the earlier suggestion of a separate workshop visual theme. Actual insulation colours in the diagram represent source data, not interface accents. Selection and electrical state use distinct outlines and text labels.

“Teach me” opens a four-part lesson: identify the parts; complete a circuit with one brake switch; predict what the second brake switch does; trace the actual Honda circuit. Include back, next, restart and optional hints. Correctness feedback explains why an answer is right or wrong. Do not penalise exploration.

“Explore” removes lesson prompts and immediately exposes all verified parts and wire segments. Switching between modes retains switch positions and selection. Learners can return to their lesson step. Restart resets the lesson, answers, switches and selection to a documented initial state.

Controls toggle ignition, front brake and rear brake. The simulation is static circuit state, not timing or electrical measurements. The light is on only when ignition is on and either brake switch is closed. Both brake switches are normally open and act in parallel. Include explicit “Brake light on/off” and switch open/closed text; colour alone is insufficient.

## Diagram and electrical fidelity

Two views use one circuit definition: a simplified teaching layout and an enlarged factory reference. The teaching layout may change positions, but never connectivity. Clicking a wire selects electrically continuous segments and their endpoints. Selection stops at switches, fuses and lamps; it does not imply those components conduct under current conditions. Energised-path highlighting is calculated separately and only crosses a closed switch.

Wire entries carry source colour codes and readable names. Preserve base and stripe colours. Show connector boundaries wherever the manual changes codes. The lamp connector on page 22-3 shows harness G/Y, G and Bl/Br, with lamp-side Bl/Y, Bl and Bl/W. The brake input, return and tail input must remain separate. Tail lighting is contextual and excluded from the brake-light simulation; never simulate the entire rear assembly as a single lamp.

Before coding the model, trace the complete brake-light subset against manual 22-3, uploaded PDF page 649: ignition supply, relevant main and branch fuses, both brake switches, their connectors, joined brake feed, rear lamp connector and ground return. Record each segment and source locator in a checked-in source note. Any unresolved connection or label blocks that segment from being represented as verified. Do not invent connector pin numbers, physical locations or photographs. A connector drawing’s terminal order is not a proven physical pin orientation.

The factory view includes an unchanged image of page 22-3, with source attribution and a clear note that scan enlargement cannot recover lost detail. It is a visual reference, not a clickable whole-bike circuit. Only the traced subset is interactive. The complete non-ABS sheet is available inside the lesson; both variant sheets are available on the bike page. The initial lesson includes only the needed reference sheets. The subsequent full onboarding request adds the unchanged uploaded manual under `public/manuals/` so source procedures are accessible from the bike reference.

## Implementation boundaries

Use existing React, TypeScript, Tailwind and inline scalable vector graphics (SVG); add no dependency. Keep the circuit data, circuit-state calculation, drawing and lesson presentation separate. Avoid a generic lesson engine or full electrical simulator.

Create bike-linked routes under `src/app/bikes/honda-cb1000r-sc60/` and circuit components under `src/components/circuits/`: server page with metadata, client lesson component, diagram component, circuit data/state module and co-located tests. Add a source reference note under `Docs/` and the reference image under `public/`. Modify `BikeDetailTabs.tsx` and its tests for bike-specific lesson eligibility and entry. Add the verified bike record and a focused additive import script using existing tables; no schema migration. Ensure a known supported bike has a Wiring tab even before unrelated document queries complete. Add dedicated source-data colour classes for wire insulation and stripe rendering in `globals.css`; interface surfaces use existing semantic tokens.

Support keyboard selection and visible focus for all interactive parts. Provide matching text controls for small diagram targets. At 320px width, controls and explanations must fit without page overflow; allow scrolling or zooming inside the diagram viewport. Include reset zoom. Both themes must keep black and white wires visible through a contrasting outline. Respect reduced motion; no travelling-current animation.

Use the existing educational disclaimer. The lesson contains no physical repair instructions or advice to bypass safety systems.

## Verification

Baseline: 115 test files and 993 tests passed in the isolated worktree before feature work.

Electrical tests cover all eight ignition/front/rear combinations, both brakes together, independent parallel branches and connector colour changes. Behaviour tests cover mode changes, prediction feedback, back/next/restart, selection versus energised state, keyboard controls and the Wiring-tab entry’s bike/variant eligibility and additive import idempotency.

Run lint, the full test suite, coverage, type checking and production build. Check the actual page in a browser at narrow mobile and desktop widths, light and dark themes. Compare interactive connections against the source note and factory sheet with a fresh-context reviewer. Report unresolved source details and any environment-dependent build limitation explicitly.

## Not included

Whole-bike tracing, ABS simulation, simulated faults, diagnosis, meter readings, physical connector photographs, extra models, persistent lesson progress, accounts or content-authoring tools.
