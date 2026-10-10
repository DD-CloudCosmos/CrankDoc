# Honda SC60 brake-light source record

Authoritative source: supplied Honda_CB1000R_Service_manual.pdf, April 2008 service manual, Section 22. PDF page 649 is manual 22-3 (CB1000R, non-ABS). PDF page 650 is manual 22-4 (CB1000RA, ABS). Both sheets have been visually checked for this subset. Public reference images retain the entire unmodified scan at 300 dpi (4813 × 3293 rendered pixels). The unchanged full manual is now included at `public/manuals/honda-cb1000r-2008.pdf` for the expanded onboarding reference.

## Traced connections

| Connection | Source code | Source location |
|---|---|---|
| Main 30 A fuse to ignition BAT1 terminal | R | Starting/battery group lower right; ignition upper left-centre |
| Ignition IG terminal to branch fuse-box input | R/Bl | Ignition 2P brown connector and fuse box lower centre-left |
| Fuse C, 10 A, branch output | W/G | Fuse-box C output and fuse legend, both sheets |
| Front switch input, harness to switch | W/G → Bl/G | Upper centre brake switch and 6P waterproof black connector |
| Front switch output, switch to harness | Bl/G → G/Y | Same switch and 6P connector |
| Rear switch input, harness to switch | W/G → Bl | Lower centre rear switch waterproof black connector |
| Rear switch output, switch to harness | Bl → G/Y | Same rear switch connector |
| Joined brake feed, harness to lamp | G/Y → Bl/Y | Right edge brake/tail assembly, 3P connector |
| Lamp return, lamp to harness | Bl → G | Same lamp connector and shared green ground wiring |
| Tail input (excluded) | Bl/Br → Bl/W | Same 3P lamp connector; independent tail circuit |

Both normally open brake switches connect the same fused supply to the same joined output. Either can complete the brake-light circuit. The engine stop switch is not in this brake-light path. Fuse C is 10 A on both variants. Other fuse letters differ between variants and are not modelled.

## Teaching simplifications

The inline drawing is rearranged. The fuse, ignition and lamp stop wire selection. Selection ignores current switch state; completed-path highlighting crosses only the switch branches currently closed. Supply and return branches share selection groups only where the factory diagram shows an electrical connection.

The main fuse, branch fuse and ground connection are assumed intact. The return route expresses the common electrical return, not an extra physical lamp-to-battery wire. Ground harness splices, main-fuse internal construction and connectors that do not change wire colours are not expanded. Each switch connector boundary is drawn on the input and output wires; these are two conductors of the same connector, not two physical connector housings. Lamp connector boundaries are likewise shown separately on its conductors.

The diagram shows no physical terminal numbering or connector orientation. Those must not be inferred from left-to-right conductor order. Completed-path highlighting is not a voltage map: supply wires can be live with both brakes released. No current-speed animation or meter readings are shown. The tail-light input is excluded, so “Brake light off” does not mean the rear assembly is entirely dark.

## Catalogue scope and uncertainty

The checked-in catalogue entry is a 2008 manual reference, not a verified model-year decode of David’s bike. Its certificate was issued in July 2008 and lists SC60, CB1000R, 998 cc and 77 kW. The year segment in its frame number requires further verification; no full frame number, certificate photograph or personal registration data is included in the repository. ABS cannot be confirmed from the supplied photographs. Do not label the actual motorcycle definitively non-ABS or apply unrestricted power figures. The expanded catalogue separates the unrestricted 92 kW / 99 N·m model rating from the owner’s 77 kW certificate. Whole-bike dry weight stays empty because the manual gives curb weight. See the onboarding source record for maintenance and specification provenance.

The local bike page is available without a database import. The focused import script inserts missing bike, document, image and service rows into existing tables, fills only missing supported specifications on an exact 2008 match, and never runs the repository’s destructive reseed. Populated fields and existing primary photographs are preserved. It defaults to preview. Database credentials are absent in this checkout; live import has not been performed.

## Checks

Independent source review confirmed the codes and parallel branches on both source sheets. Unit tests cover every ignition/front/rear combination and selection versus completed-path state. See the feature’s tests for lesson controls, predictions, reset and variant eligibility.
